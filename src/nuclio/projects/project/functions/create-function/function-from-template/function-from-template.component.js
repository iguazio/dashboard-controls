(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionFromTemplate', {
            bindings: {
                project: '<',
                toggleSplashScreen: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/create-function/function-from-template/function-from-template.tpl.html',
            controller: FunctionFromTemplateController
        });

    function FunctionFromTemplateController($interval, $state, $stateParams, $q, lodash, DialogsService, FunctionsService,
                                            ValidatingPatternsService, NuclioFunctionsDataService, NuclioProjectsDataService) {
        var ctrl = this;
        var interval = null;

        ctrl.functionData = {};
        ctrl.selectedTemplate = '';
        ctrl.templates = [];

        ctrl.$onInit = onInit;

        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.cancelCreating = cancelCreating;
        ctrl.createFunction = createFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isTemplateSelected = isTemplateSelected;
        ctrl.selectTemplate = selectTemplate;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.toggleSplashScreen({value: true});

            initFunctionData();
        }

        //
        // Public methods
        //

        /**
         * Cancels creating a function
         */
        function cancelCreating(event) {
            event.preventDefault();

            $state.go('app.project.functions', {
                projectId: ctrl.project.metadata.name
            });
        }

        /**
         * Callback handler for 'create function' button
         * Creates function with defined data.
         */
        function createFunction() {

            // create function only when form is valid
            if (ctrl.functionFromTemplateForm.$valid && !lodash.isNil(ctrl.selectedTemplate)) {
                lodash.set(ctrl, 'functionData.metadata.namespace', ctrl.project.metadata.namespace);

                $state.go('app.project.function.edit.code', {
                    isNewFunction: true,
                    id: ctrl.project.metadata.name,
                    functionId: ctrl.functionData.metadata.name,
                    projectNamespace: ctrl.project.metadata.namespace,
                    functionData: ctrl.functionData
                });
            }
        }

        /**
         * Set data returned by validating input component
         * @param {string} data - data to be set
         * @param {string} field - field which should be filled
         */
        function inputValueCallback(data, field) {
            if (!lodash.isNil(data)) {
                lodash.set(ctrl, 'functionData.metadata.' + field, data);
            }
        }

        /**
         * Checks which template type is selected.
         * Returns true if 'template' is equal to 'selectedTemplate'.
         * Which means that template from argument 'template' should be selected now.
         * @param {Object} templateName
         * @returns {boolean}
         */
        function isTemplateSelected(templateName) {
            return lodash.isEqual(templateName, ctrl.selectedTemplate);
        }

        /**
         * Selects template.
         * Sets new template as selected
         * @param {Object} templateName - template to be set
         */
        function selectTemplate(templateName) {
            if (!lodash.isEqual(templateName, ctrl.selectedTemplate)) {
                ctrl.selectedTemplate = templateName;

                lodash.set(ctrl, 'functionData.spec.runtime', ctrl.templates[ctrl.selectedTemplate].spec.runtime);
                lodash.set(ctrl, 'functionData.spec.build.functionSourceCode',
                    ctrl.templates[ctrl.selectedTemplate].spec.build.functionSourceCode);
            }
        }

        //
        // Private methods
        //

        /**
         * Gets default selected template
         * @returns {Object} template to be set as selected
         */
        function getSelectedTemplate() {
            return lodash.keys(ctrl.templates)[0];
        }

        /**
         * Initialize object for function from template
         */
        function initFunctionData() {

            // gets all available function templates
            NuclioFunctionsDataService.getTemplates()
                .then(function (repsonse) {
                    ctrl.templates = repsonse.data;
                    ctrl.selectedTemplate = getSelectedTemplate();
                    var selectedTemplate = ctrl.templates[ctrl.selectedTemplate];

                    ctrl.functionData = {
                        metadata: {
                            name: '',
                            namespace: ''
                        },
                        spec: {
                            handler: FunctionsService.getHandler(selectedTemplate.spec.runtime),
                            runtime: selectedTemplate.spec.runtime,
                            build: {
                                functionSourceCode: selectedTemplate.spec.build.functionSourceCode
                            }
                        }
                    };
                })
                .catch(function () {
                    DialogsService.alert('Oops: Unknown error occurred');
                })
                .finally(function () {
                    ctrl.toggleSplashScreen({value: false});
                });
        }
    }
}());
