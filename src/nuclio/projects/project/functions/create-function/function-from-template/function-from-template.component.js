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
                                            ValidatingPatternsService, NuclioFunctionsDataService) {
        var ctrl = this;

        ctrl.functionData = {};
        ctrl.selectedTemplate = '';
        ctrl.templates = {};

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
                projectId: ctrl.project.metadata.name,
                createCancelled: true
            });
        }

        /**
         * Callback handler for 'create function' button
         * Creates function with defined data.
         */
        function createFunction() {

            // create function only when form is valid
            if (ctrl.functionFromTemplateForm.$valid && !lodash.isNil(ctrl.selectedTemplate)) {
                ctrl.toggleSplashScreen({value: true});

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
         * @param {Object} templateName - name of the template to be set
         */
        function selectTemplate(templateName) {
            if (!lodash.isEqual(templateName, ctrl.selectedTemplate)) {
                ctrl.selectedTemplate = templateName;

                // set new runtime
                lodash.set(ctrl, 'functionData.spec.runtime', ctrl.templates[ctrl.selectedTemplate].spec.runtime);

                // set new resources
                lodash.set(ctrl, 'functionData.spec.resources', ctrl.templates[ctrl.selectedTemplate].spec.resources);

                // set new handler
                lodash.set(ctrl, 'functionData.spec.handler',
                    FunctionsService.getHandler(ctrl.templates[ctrl.selectedTemplate].spec.runtime));

                // set new functionSourceCode
                lodash.set(ctrl, 'functionData.spec.build.functionSourceCode',
                    ctrl.templates[ctrl.selectedTemplate].spec.build.functionSourceCode);

                // set new build commands
                lodash.set(ctrl, 'functionData.spec.build.commands',
                    ctrl.templates[ctrl.selectedTemplate].spec.build.commands);
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
                .then(function (response) {
                    convertFunctionTemplates(response.data)

                    ctrl.selectedTemplate = getSelectedTemplate();
                    var selectedTemplate = ctrl.templates[ctrl.selectedTemplate];

                    ctrl.functionData = {
                        metadata: {
                            name: '',
                            namespace: ''
                        },
                        spec: {
                            resources: selectedTemplate.spec.resources,
                            handler: FunctionsService.getHandler(selectedTemplate.spec.runtime),
                            runtime: selectedTemplate.spec.runtime,
                            build: {
                                functionSourceCode: selectedTemplate.spec.build.functionSourceCode,
                                commands: selectedTemplate.spec.build.commands
                            }
                        }
                    };
                })
                .catch(function (error) {
                    DialogsService.alert('Oops: Unknown error occurred');
                })
                .finally(function () {
                    ctrl.toggleSplashScreen({value: false});
                });
        }

        /**
         * Converts function template to be more readable
         * @param {Object} templates - templates to be convert
         */
        function convertFunctionTemplates(templates) {
            lodash.forOwn(templates, function (value, key) {
                var title = key.split(':')[0] + ' (' + value.spec.runtime + ')';

                ctrl.templates[title] = value;
            });
        }
    }
}());
