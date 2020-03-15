(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('NavigationTabsService', NavigationTabsService);

    function NavigationTabsService($i18next, i18next, lodash, ConfigService) {
        return {
            getNavigationTabsConfig: getNavigationTabsConfig
        };

        //
        // Public methods
        //

        /**
         * Returns navigation tabs config depending on current state
         * @param {string} state
         * @returns {Array}
         */
        function getNavigationTabsConfig(state) {
            var navigationTabsConfigs = {
                'app.container': getContainersConfig(),
                'app.cluster': getClustersConfig(),
                'app.events': getEventsConfig(),
                'app.storage-pool': getStoragePoolsConfig(),
                'app.identity': getIdentityConfig(),
                'app.control-panel': getControlPanelConfig()
            };
            var stateTest = state.match(/^[^.]*.[^.]*/);

            return lodash.get(navigationTabsConfigs, stateTest[0], []);
        }

        //
        // Private methods
        //

        /**
         * Returns containers navigation tabs config
         * @returns {Array.<Object>}
         */
        function getContainersConfig() {
            var lng = i18next.language;

            var config = [
                {
                    tabName: $i18next.t('common:OVERVIEW', {lng: lng}),
                    id: 'overview',
                    uiRoute: 'app.container.overview',
                    capability: 'containers.overview'
                },
                {
                    tabName: $i18next.t('common:BROWSE', {lng: lng}),
                    id: 'browse',
                    uiRoute: 'app.container.browser',
                    capability: 'containers.browse'
                },
                {
                    tabName: $i18next.t('common:DATA_ACCESS_POLICY', {lng: lng}),
                    id: 'dataAccessPolicy',
                    uiRoute: 'app.container.data-access-policy',
                    capability: 'containers.dataPolicy'
                }
            ];

            if (ConfigService.isStagingMode()) {
                config.push(
                    {
                        tabName: $i18next.t('common:DATA_LIFECYCLE', {lng: lng}),
                        id: 'dataLifecycle',
                        uiRoute: 'app.container.data-lifecycle',
                        capability: 'containers.dataLifecycle'
                    }
                );
            }

            if (ConfigService.isDemoMode()) {
                config.splice(1, 0,
                              {
                                  tabName: $i18next.t('common:ANALYTICS', {lng: lng}),
                                  id: 'analytics',
                                  uiRoute: 'app.container.analytics',
                                  capability: 'containers.analytics'
                              }
                );
            }

            return config;
        }

        /**
         * Returns clusters navigation tabs config
         * @returns {Array.<Object>}
         */
        function getClustersConfig() {
            var lng = i18next.language;

            return [
                {
                    tabName: $i18next.t('common:NODES', {lng: lng}),
                    id: 'nodes',
                    uiRoute: 'app.cluster.nodes',
                    capability: 'clusters.nodes'
                }
            ];
        }

        /**
         * Returns storage pools navigation tabs config
         * @returns {Array.<Object>}
         */
        function getStoragePoolsConfig() {
            var lng = i18next.language;

            var config = [
                {
                    tabName: $i18next.t('common:OVERVIEW', {lng: lng}),
                    id: 'overview',
                    uiRoute: 'app.storage-pool.overview',
                    capability: 'storagePools.overview'
                },
                {
                    tabName: $i18next.t('common:DEVICES', {lng: lng}),
                    id: 'devices',
                    uiRoute: 'app.storage-pool.devices',
                    capability: 'storagePools.listDevices'
                }
            ];

            if (ConfigService.isStagingMode()) {
                config.splice(1, 0,
                              {
                                  tabName: $i18next.t('common:CONTAINERS', {lng: lng}),
                                  id: 'containers',
                                  uiRoute: 'app.storage-pool.containers',
                                  capability: 'storagePools.listContainers'
                              }
                );
            }

            return config;
        }

        /**
         * Returns control panel navigation tabs config
         * @returns {Array.<Object>}
         */
        function getControlPanelConfig() {
            var lng = i18next.language;

            return [{
                tabName: $i18next.t('common:LOGS', {lng: lng}),
                id: 'logs',
                uiRoute: 'app.control-panel.logs'
            }];
        }

        /**
         * Returns identity navigation tabs config
         * @returns {Array.<Object>}
         */
        function getIdentityConfig() {
            var lng = i18next.language;

            var config = [
                {
                    tabName: $i18next.t('common:USERS', {lng: lng}),
                    id: 'users',
                    uiRoute: 'app.identity.users',
                    capability: 'identity.users'
                },
                {
                    tabName: $i18next.t('common:GROUPS', {lng: lng}),
                    id: 'groups',
                    uiRoute: 'app.identity.groups',
                    capability: 'identity.groups'
                }
            ];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: $i18next.t('common:IDP', {lng: lng}),
                    id: 'idp',
                    uiRoute: 'app.identity.idp',
                    capability: 'identity.idp'
                });
            }

            return config;
        }

        /**
         * Returns events navigation tabs config
         * @returns {Array.<Object>}
         */
        function getEventsConfig() {
            var lng = i18next.language;

            var config = [
                {
                    tabName: $i18next.t('common:EVENT_LOG', {lng: lng}),
                    id: 'eventLog',
                    uiRoute: 'app.events.event-log',
                    capability: 'events.eventLog'
                },
                {
                    tabName: $i18next.t('common:ALERTS', {lng: lng}),
                    id: '',
                    uiRoute: 'app.events.alerts',
                    capability: 'events.alerts'
                }
            ];

            if (ConfigService.isStagingMode()) {
                config.push(
                    {
                        tabName: $i18next.t('common:ESCALATION', {lng: lng}),
                        id: 'escalation',
                        uiRoute: 'app.events.escalation',
                        capability: 'events.escalations'
                    },
                    {
                        tabName: $i18next.t('common:TASKS', {lng: lng}),
                        id: 'tasks',
                        uiRoute: 'app.events.tasks',
                        capability: 'events.tasks'
                    }
                );
            }

            return config;
        }
    }
}());
