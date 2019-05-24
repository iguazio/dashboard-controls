(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('SeverityDropdownService', SeverityDropdownService);

    function SeverityDropdownService($i18next, i18next) {
        return {
            getSeveritiesArray: getSeveritiesArray
        };

        //
        // Public methods
        //

        /**
         * Gets array of severity types
         * @returns {Array}
         */
        function getSeveritiesArray() {
            var lng = i18next.language;
            return [
                {
                    name: $i18next.t('common:ERROR', {lng: lng}),
                    type: 'error',
                    icon: {
                        name: 'igz-icon-warning severity-icon critical'
                    }
                },
                {
                    name: $i18next.t('common:DEBUG', {lng: lng}),
                    type: 'debug',
                    icon: {
                        name: 'igz-icon-warning severity-icon major'
                    }
                },
                {
                    name: $i18next.t('common:WARNING', {lng: lng}),
                    type: 'warning',
                    icon: {
                        name: 'igz-icon-warning severity-icon warning'
                    }
                },
                {
                    name: $i18next.t('common:INFO', {lng: lng}),
                    type: 'info',
                    icon: {
                        name: 'igz-icon-info-round severity-icon info'
                    }
                }
            ];
        }
    }
}());
