(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationDataBindings', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-data-bindings/version-configuration-data-bindings.tpl.html',
            controller: NclVersionConfigurationDataBindingsController
        });

    function NclVersionConfigurationDataBindingsController($rootScope, $stateParams, lodash, DialogsService) {
        var ctrl = this;

        ctrl.isCreateModeActive = false;
        ctrl.bindings = [];

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

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
            ctrl.bindings = lodash.map(ctrl.version.spec.dataBindings, function (value, key) {
                var bindingsItem = angular.copy(value);
                bindingsItem.id = key;
                bindingsItem.name = key;

                return bindingsItem;
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', {component: 'binding', isDisabled: false});
        }

        //
        // Public methods
        //

        /**
         * Toggle create binding mode
         * @param {Event} event
         */
        function createBinding(event) {
            if (!isBindingInEditMode()) {
                ctrl.bindings.push({
                    id: '',
                    name: '',
                    kind: '',
                    attributes: {},
                    ui: {
                        editModeActive: true,
                    }
                });
                event.stopPropagation();
                $rootScope.$broadcast('change-state-deploy-button', {component: 'binding', isDisabled: true});
            }
        }

        /**
         * Edit item callback function
         * @param {Object} item - selected item
         */
        function editBindingCallback(item) {
            ctrl.handleAction('update', item);

            $rootScope.$broadcast('change-state-deploy-button', {component: 'binding', isDisabled: false});
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
                var currentBinding = lodash.find(ctrl.bindings, ['id', selectedItem.id]);

                if (angular.isDefined(currentBinding)) {
                    if (!lodash.isEmpty(selectedItem.id)) {
                        lodash.unset(ctrl.version, 'spec.dataBindings.' + selectedItem.id);
                    }

                    var bindingItem = {
                        kind: selectedItem.kind,
                        attributes: selectedItem.attributes
                    };

                    if (angular.isDefined(selectedItem.url)) {
                        bindingItem.url = selectedItem.url;
                    }

                    if (angular.isDefined(selectedItem.secret)) {
                        bindingItem.secret = selectedItem.secret;
                    }

                    lodash.set(ctrl.version, 'spec.dataBindings.' + selectedItem.name, bindingItem);
                    selectedItem.id = selectedItem.name;

                    if (!lodash.isEqual(currentBinding, selectedItem)) {
                        angular.copy(selectedItem, currentBinding);
                    }
                }
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
            }
            ctrl.onChangeCallback();
        }

        /**
         * Check if trigger is in edit mode
         * @returns {boolean}
         */
        function isBindingInEditMode() {
            var bindingInEditMode = false;
            ctrl.bindings.forEach(function (binding) {
                if (binding.ui.editModeActive) {
                    bindingInEditMode = true;
                }
            });
            return bindingInEditMode;
        }
    }
}());
