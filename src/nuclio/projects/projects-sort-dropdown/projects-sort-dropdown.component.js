(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclProjectsSortDropdown', {
            bindings: {
                sortOptions: '<',
                updateDataCallback: '&?'
            },
            templateUrl: 'nuclio/projects/projects-sort-dropdown/projects-sort-dropdown.tpl.html',
            controller: NclProjectsSortDropdownController
        });

    function NclProjectsSortDropdownController() {
        var ctrl = this;
    }
}());
