(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationDataBindings', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-data-bindings/version-configuration-data-bindings.tpl.html',
            controller: NclVersionConfigurationDataBindingsController
        });

    function NclVersionConfigurationDataBindingsController($stateParams, lodash, DialogsService) {
        var ctrl = this;

        ctrl.isCreateModeActive = false;
        ctrl.bindings = [];

        ctrl.$onInit = onInit;

        ctrl.createBinding = createBinding;
        ctrl.editBindingCallback = editBindingCallback;
        ctrl.handleAction = handleAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            // get bindings list
            ctrl.bindings = [];
            lodash.forOwn(ctrl.version.spec.dataBindings, function (value, key) {
                var binding = angular.copy(value);

                binding.id = key;
                binding.name = key;

                ctrl.bindings.push(binding);
            });
        }

        //
        // Public methods
        //

        /**
         * Toggle create binding mode
         * @param {Event} event
         */
        function createBinding(event) {
            ctrl.bindings.push({
                id: '',
                name: '',
                kind: '',
                attributes: {},
                ui: {
                    editModeActive: true,
                    expanded: true
                }
            });
            event.stopPropagation();
        }

        /**
         * Edit item callback function
         * @param {Object} item - selected item
         */
        function editBindingCallback(item) {
            ctrl.handleAction('update', item);

            item.ui.editModeActive = false;
            item.ui.expanded = false;
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - ex. `delete`
         * @param {Array} selectedItem - an object of selected binding
         */
        function handleAction(actionType, selectedItem) {
            if (actionType === 'delete') {
                lodash.remove(ctrl.bindings, ['id', selectedItem.id]);
                lodash.unset(ctrl.version, 'spec.dataBindings.' + selectedItem.id);
            } else if (actionType === 'edit') {
                lodash.find(ctrl.bindings, ['id', selectedItem.id]).ui.editModeActive = true;
            } else if (actionType === 'update') {
                if (!lodash.isEmpty(selectedItem.id)) {
                    lodash.unset(ctrl.version, 'spec.dataBindings.' + selectedItem.id);
                }
                var bindingItem = {
                    kind: selectedItem.kind,
                    attributes: selectedItem.attributes
                };

                if (angular.isDefined(selectedItem.url)) {
                    lodash.assign(bindingItem, {
                        url: selectedItem.url
                    });
                }

                lodash.set(ctrl.version, 'spec.dataBindings.' + selectedItem.name, bindingItem);
                selectedItem.id = selectedItem.name;

                // get bindings list
                ctrl.bindings = [];
                lodash.forOwn(ctrl.version.spec.dataBindings, function (value, key) {
                    var binding = angular.copy(value);

                    binding.id = key;
                    binding.name = key;

                    ctrl.bindings.push(binding);
                });
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
            }
        }
    }
}());
