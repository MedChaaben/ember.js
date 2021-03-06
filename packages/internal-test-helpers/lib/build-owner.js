import { Registry, FACTORY_FOR, LOOKUP_FACTORY } from 'container';
import { Router } from 'ember-routing';
import {
  Application,
  ApplicationInstance
} from 'ember-application';
import { isFeatureEnabled } from 'ember-debug';
import {
  RegistryProxyMixin,
  ContainerProxyMixin,
  Object as EmberObject
} from 'ember-runtime';

export default function buildOwner(options = {}) {
  let ownerOptions = options.ownerOptions || {};
  let resolver = options.resolver;
  let bootOptions = options.bootOptions || {};

  let Owner = EmberObject.extend(RegistryProxyMixin, ContainerProxyMixin, {
    [FACTORY_FOR]() {
      return this.__container__[FACTORY_FOR](...arguments);
    },
    [LOOKUP_FACTORY]() {
      return this.__container__[LOOKUP_FACTORY](...arguments);
    }
  });

  if (isFeatureEnabled('ember-factory-for')) {
    Owner.reopen({
      factoryFor() {
        return this.__container__.factoryFor(...arguments);
      }
    });
  }

  let namespace = EmberObject.create({
    Resolver: { create() { return resolver; } }
  });

  let fallbackRegistry = Application.buildRegistry(namespace);
  fallbackRegistry.register('router:main', Router);

  let registry = new Registry({
    fallback: fallbackRegistry
  });

  ApplicationInstance.setupRegistry(registry, bootOptions);

  let owner = Owner.create({
    __registry__: registry,
    __container__: null
  }, ownerOptions);

  let container = registry.container({ owner: owner });
  owner.__container__ = container;

  return owner;
}
