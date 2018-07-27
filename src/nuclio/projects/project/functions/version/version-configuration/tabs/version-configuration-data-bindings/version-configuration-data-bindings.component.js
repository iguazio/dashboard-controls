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

    function NclVersionConfigurationDataBindingsController($rootScope, lodash, DialogsService) {
        var ctrl = this;

        ctrl.isCreateModeActive = false;
        ctrl.bindings = [];
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.createBinding = createBinding;
        ctrl.editBindingCallback = editBindingCallback;
        ctrl.isScrollNeeded = isScrollNeeded;
        ctrl.handleAction = handleAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // get bindings list
            ctrl.bindings = lodash.map(ctrl.version.spec.dataBindings, function (value, key) {
                var bindingsItem = angular.copy(value);
                bindingsItem.id = key;
                bindingsItem.name = key;

                if (angular.isDefined(value.url) && value.kind === 'v3io') {
                    var splitUrl = value.url.split('/');

                    // split on last slash: what comes before it is the URL, what comes after it is container ID
                    bindingsItem.url = lodash.initial(splitUrl).join('/');
                    lodash.set(bindingsItem, 'attributes.containerID', splitUrl.length > 1 ? lodash.last(splitUrl) : '');
                }

                bindingsItem.ui = {
                    editModeActive: false,
                    isFormValid: true,
                    name: 'binding'
                };

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
                        isFormValid: false,
                        name: 'binding'
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
        }

        /**
         * Returns true if scrollbar is necessary
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.bindings.length > 2;
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - e.g. `'delete'`, `'edit'`, `'update'`
         * @param {Array} selectedItem - an object of selected data-binding
         * @param {string} selectedItem.id - the identifier of the data-binding
         * @param {string} selectedItem.name - the name of the data-binding
         * @param {string} selectedItem.kind - the kind of data-binding (e.g. 'v3io', 'eventhub')
         * @param {string} [selectedItem.secret] - the secret of data-binding (for v3io kind)
         * @param {string} [selectedItem.url] - the URL of the data-binding (for v3io kind)
         * @param {Object} [selectedItem.attributes] - more custom attributes of the data-binding
         * @param {string} [selectedItem.attributes.containerID] - the container ID (for v3io kind)
         */
        function handleAction(actionType, selectedItem) {
            if (actionType === 'delete') {
                deleteHandler(selectedItem);
            } else if (actionType === 'edit') {
                editHandler(selectedItem);
            } else if (actionType === 'update') {
                updateHandler(selectedItem);
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
            }

            $rootScope.$broadcast('change-state-deploy-button', {component: 'binding', isDisabled: false});
            lodash.forEach(ctrl.bindings, function (binding) {
                if (!binding.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: binding.ui.name, isDisabled: true});
                }
            });

            ctrl.onChangeCallback();
        }

        //
        // Private methods
        //

        /**
         * Deletes selected item
         * @param {Array} selectedItem - an object of selected data-binding
         */
        function deleteHandler(selectedItem) {
            lodash.remove(ctrl.bindings, ['id', selectedItem.id]);
            lodash.unset(ctrl.version, 'spec.dataBindings.' + selectedItem.id);
        }

        /**
         * Toggles item to edit mode
         * @param {Array} selectedItem - an object of selected data-binding
         */
        function editHandler(selectedItem) {
            var aBinding = lodash.find(ctrl.bindings, ['id', selectedItem.id]);
            aBinding.ui.editModeActive = true;
        }

        /**
         * Updates data in selected item
         * @param {Array} selectedItem - an object of selected data-binding
         */
        function updateHandler(selectedItem) {
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

                    if (selectedItem.kind === 'v3io') {
                        bindingItem.url = bindingItem.url + '/' + selectedItem.attributes.containerID;
                        bindingItem.attributes = lodash.omit(bindingItem.attributes, 'containerID');
                    }
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
