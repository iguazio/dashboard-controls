(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('NuclioHeaderService', NuclioHeaderService);

    function NuclioHeaderService($rootScope, $state, lodash) {
        return {
            updateMainHeader: updateMainHeader
        };

        //
        // Public methods
        //

        /**
         * Sends broadcast with needed data object to dynamically update main header title
         * @param {string} title
         * @param {string} subtitles
         * @param {string} state
         */
        function updateMainHeader(title, subtitles, state) {
            var mainHeaderState = lodash.find($state.get(), function (mainState) {
                return mainState.url === lodash.trim($state.$current.url.prefix, '/');
            }).name;

            var mainHeaderTitle = {
                title: title,
                project: subtitles.project,
                function: lodash.defaultTo(subtitles.function, null),
                version: lodash.defaultTo(subtitles.version, null),
                tab: lodash.defaultTo(subtitles.tab, null),
                state: state,
                mainHeaderState: mainHeaderState
            };

            $rootScope.$broadcast('update-main-header-title', mainHeaderTitle);
        }
    }
}());
