import { Selector } from 'testcafe'

fixture`Device List Tests`
    .page`http://localhost:3001/`

test('Test 1: Verify devices are displayed correctly', async t => {
    const response = await t.request({
        url: 'http://localhost:3000/devices',
        method: 'GET',
    })

    const devices = response.body

    for (const device of devices) {
        const deviceName = Selector('.device-name').withText(device.system_name)
        const deviceType = Selector('.device-type').withText(device.type)
        const deviceCapacity = Selector('.device-capacity').withText(device.hdd_capacity)

        await t
            .expect(deviceName.visible).ok(`Device name ${device.name} is not visible`)
            .expect(deviceType.visible).ok(`Device type ${device.type} is not visible`)
            .expect(deviceCapacity.visible).ok(`Device capacity ${device.capacity} is not visible`)

        const editButton = deviceName.parent().find('.device-edit')
        const deleteButton = deviceName.parent().find('.device-remove')

        await t
            .expect(editButton.visible).ok('Edit button is not visible')
            .expect(deleteButton.visible).ok('Delete button is not visible')
    }
})

test('Test 2: Verify that device can be created', async t => {
    const newDeviceName = `DJ-Laptop-${Math.floor(Math.random() * 1000000)}`    
    const newDeviceType = 'MAC'
    const newHddCapacity = '32'

    const deviceTypeDropdown = Selector('#type')

    await t
        .click('.submitButton')
        .typeText('#system_name', newDeviceName)
        .click(deviceTypeDropdown)
        .click(deviceTypeDropdown.find('option').withText(newDeviceType))
        .typeText('#hdd_capacity', newHddCapacity)
        .click('.submitButton')

    const addedDeviceName = Selector('.device-name').withText(newDeviceName)
    const addedDeviceType = addedDeviceName.sibling('.device-type')
    const addedDeviceCapacity = addedDeviceName.sibling('.device-capacity')

    await t
        .expect(addedDeviceName.visible).ok(`Added device name ${addedDeviceName} is not visible`)
        .expect(addedDeviceType.visible).ok(`Device type is not visible`)
        .expect(addedDeviceType.textContent).eql(newDeviceType, `Expected device type to be "${newDeviceType}"`)
        .expect(addedDeviceCapacity.visible).ok(`Device capacity is not visible`)
        .expect(addedDeviceCapacity.textContent).contains(`${newHddCapacity} GB`, `Expected device capacity to be "${newHddCapacity}"`)

    const deleteButton = addedDeviceName.parent().find('.device-remove')
    
    await t.expect(deleteButton.visible).ok('Delete button not found or not visible')
        .click(deleteButton)
        .expect(addedDeviceName.exists).notOk('Device was not removed successfully')
})

test('Test 3: Rename the first device via API and verify it in the UI', async t => {
    const response = await t.request({
        url: 'http://localhost:3000/devices',
        method: 'GET',
    })

    const devices = response.body
    const firstDeviceId = devices[0].id

    const renamedDeviceName = 'Renamed Device'
    await t.request({
        url: `http://localhost:3000/devices/${firstDeviceId}`,
        method: 'PUT',
        body: {
            ...devices[0],
            system_name: renamedDeviceName,
        },
        headers: {
            'Content-Type': 'application/json',
        },
    })

    await t.eval(() => location.reload())

    const modifiedDevice = Selector('.device-name').withText(renamedDeviceName)
    await t.expect(modifiedDevice.visible).ok('Renamed device was not updated in the UI')
})


test('Test 4: Delete the last device via API and verify it in the UI', async t => {
    const response = await t.request({
        url: 'http://localhost:3000/devices',
        method: 'GET',
    })

    const devices = response.body
    const lastDeviceId = devices[devices.length - 1].id
    const lastDeviceName = devices[devices.length - 1].system_name

    await t.request({
        url: `http://localhost:3000/devices/${lastDeviceId}`,
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    await t.eval(() => location.reload())

    const deletedDevice = Selector('.device-name').withText(lastDeviceName)
    await t.expect(deletedDevice.exists).notOk('Deleted device is still visible in the UI')
})
