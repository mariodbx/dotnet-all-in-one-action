import { IRegistry } from '../interfaces/IRegistry.js'
import { GHCRRegistry } from './GHCRRegistry.js'
import { ACRRegistry } from './ACRRegistry.js'
import { DockerHubRegistry } from './DockerHubRegistry.js'

/**
 * Factory to create registry instances.
 */
export class RegistryFactory {
  static createRegistry(registryType: string): IRegistry {
    switch (registryType.toLowerCase()) {
      case 'ghcr':
        return new GHCRRegistry()
      case 'acr':
        return new ACRRegistry()
      case 'dockerhub':
        return new DockerHubRegistry()
      default:
        throw new Error(`Unsupported registry type: ${registryType}`)
    }
  }
}
