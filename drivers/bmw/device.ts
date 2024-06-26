import { Vehicle } from '../Vehicle';

class Bmw extends Vehicle {
    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.logger?.LogInformation(`BMW (${this.deviceData.id}) has been added`);
    }
}

module.exports = Bmw;
