import { Driver } from 'homey';
import { BMWConnectedDrive } from '../app';
import { DeviceData } from '../utils/DeviceData';
import { Configuration } from '../utils/Configuration';
import { ConfigurationManager } from '../utils/ConfigurationManager';
import { CarBrand, ConnectedDrive, Vehicle } from "bmw-connected-drive";
import { Settings } from '../utils/Settings';

export class ConnectedDriver extends Driver {
  brand: CarBrand = CarBrand.Bmw;

  async onPair(session: any) {
    session.setHandler('showView', async (view: string) => {
      if (view === 'loading') {
        const app = (this.homey.app as BMWConnectedDrive);

        // Test if the credentials are valid
        if (app.connectedDriveApi) {
          try {
            await app.connectedDriveApi.account.getToken();
            await session.showView('list_devices');
            return;
          } catch (err) {
            this.log(err);
          }
        }

        // Otherwise redirect to the login view
        await session.nextView();
      }
    });

    session.setHandler("login", async (data: any) => {
      const app = (this.homey.app as BMWConnectedDrive);
      let configuration = ConfigurationManager.getConfiguration(this.homey);
      if (!configuration) {
        configuration = new Configuration();
      }

      configuration.username = data.username;
      configuration.password = data.password;

      ConfigurationManager.setConfiguration(this.homey, configuration);

      try {
        const api = new ConnectedDrive(configuration.username, configuration.password, configuration.region, app.tokenStore);
        await api.account.getToken();
        app.connectedDriveApi = api;
        return true;
      } catch (err) {
        app.logger?.LogError(err);
        return false;
      }
    });

    session.setHandler("list_devices", async () => {
      const api = (this.homey.app as BMWConnectedDrive).connectedDriveApi;

      if (!api) {
        throw new Error("ConnectedDrive API is not initialized.");
      }

      const vehicles = await api.getVehicles();

      return await Promise.all(vehicles
        .filter(vehicle => vehicle.attributes.brand === this.brand)
        .map(async (vehicle) => {
          this.log(`Vehicle found: ${vehicle.vin}, ${vehicle.attributes.model} (${vehicle.attributes.year})`);

          if (!vehicle.vin) {
            throw new Error("Cannot list vehicle as vin is empty.");
          }

          const deviceData = new DeviceData();
          deviceData.id = vehicle.vin;

          return {
            name: `${vehicle.attributes.model} (${vehicle.attributes.year})`,
            data: deviceData,
            settings: new Settings(),
            icon: "icon.svg",
            capabilities: await this.getCapabilities(vehicle),
          };
        }));
    });
  }

  async getCapabilities(vehicle: Vehicle): Promise<string[]> {
    const api = (this.homey.app as BMWConnectedDrive).connectedDriveApi;
    var vehicleCapabilities = await api?.getVehicleCapabilities(vehicle.vin, vehicle.attributes.brand);

    var capabilities = [
      'alarm_generic',
      'address_capability',
      'charging_status_capability',
      'climate_now_capability',
      'location_capability',
      'measure_battery',
      'mileage_capability',
      'only_lock_unlock_flow_capability',
      'range_capability',
    ];

    // If the vehicle is a hybrid, make distinction between battery and fuel
    if (this.isHybrid(vehicle)) {
      capabilities.push('range_capability.battery');
      capabilities.push('range_capability.fuel');
    }

    // If the vehicle has a combustion engine, add fuel capabilities
    if (this.isHybrid(vehicle) || this.isFuel(vehicle)) {
      capabilities.push('remaining_fuel_capability');
      capabilities.push('remaining_fuel_liters_capability');
    }

    return capabilities;
  }

  isHybrid(vehicle: Vehicle): boolean {
    return vehicle.attributes.driveTrain in ['PLUGIN_HYBRID', 'ELECTRIC_WITH_RANGE_EXTENDER', 'HYBRID', 'MILD_HYBRID'];
  }

  isElectric(vehicle: Vehicle): boolean {
    return vehicle.attributes.driveTrain in ['ELECTRIC'];
  }

  isFuel(vehicle: Vehicle): boolean {
    return vehicle.attributes.driveTrain in ['COMBUSTION'];
  }
}