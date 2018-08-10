(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionFromTemplate', {
            bindings: {
                project: '<',
                toggleSplashScreen: '&',
                getFunctionTemplates: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/create-function/function-from-template/function-from-template.tpl.html',
            controller: FunctionFromTemplateController
        });

    function FunctionFromTemplateController($state, $timeout, lodash, DialogsService, ValidatingPatternsService) {
        var ctrl = this;
        var templatesOriginalObject = {}; // will always save original templates

        ctrl.functionName = '';
        ctrl.templatesWorkingCopy = {};
        ctrl.inputModelOptions = {
            debounce: {
                'default': 0
            }
        };
        ctrl.functionData = {};
        ctrl.isCreateFunctionAllowed = false;
        ctrl.page = {};
        ctrl.runtimeFilters = [];
        ctrl.selectedTemplate = '';
        ctrl.selectedRuntimeFilter = {
            id: 'all',
            name: 'All',
            visible: true
        };
        ctrl.searchQuery = '';

        ctrl.$onInit = onInit;

        ctrl.validationPatterns = ValidatingPatternsService;

        ctrl.cancelCreating = cancelCreating;
        ctrl.createFunction = createFunction;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isTemplateSelected = isTemplateSelected;
        ctrl.onChangeSearchQuery = onChangeSearchQuery;
        ctrl.onRuntimeFilterChange = onRuntimeFilterChange;
        ctrl.paginationCallback = paginationCallback;
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

                lodash.assign(ctrl.functionData.metadata, {
                    name: ctrl.functionName
                });

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
            $timeout(function () {
                if (!lodash.isNil(data)) {
                    lodash.set(ctrl, 'functionName', data);

                    ctrl.isCreateFunctionAllowed = lodash.isEmpty(ctrl.functionFromTemplateForm.$error);
                }
            });
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
         * Search input callback
         */
        function onChangeSearchQuery() {
            paginateTemplates();
        }

        /**
         * Runtime filter drop-down callback
         * @param {Object} runtime - selected runtime
         */
        function onRuntimeFilterChange(runtime) {

            // set new runtime filter
            ctrl.selectedRuntimeFilter = runtime;

            paginateTemplates();
        }

        /**
         * Change pagination page callback
         * @param {number} page - page number
         */
        function paginationCallback(page) {
            ctrl.page.number = page;

            paginateTemplates();
        }

        /**
         * Selects template.
         * Sets new template as selected
         * @param {Object} templateName - name of the template to be set
         */
        function selectTemplate(templateName) {
            if (!lodash.isEqual(templateName, ctrl.selectedTemplate)) {
                ctrl.selectedTemplate = templateName;

                // assign new template
                ctrl.functionData = angular.copy(ctrl.templatesWorkingCopy[ctrl.selectedTemplate]);
            }
        }

        //
        // Private methods
        //

        /**
         * Returns true if template's runtime is matched a selected runtime filter
         * @param {Object} template - template to filter.
         * @returns {boolean}
         */
        function filterByRuntime(template) {
            return ctrl.selectedRuntimeFilter.id === 'all' ||
                template.spec.runtime === ctrl.selectedRuntimeFilter.id;
        }

        /**
         * Returns true if template's title or description is matched a search query.
         * @param {Object} template - template to filter.
         * @returns {boolean}
         */
        function filterByTitleAndDescription(template) {
            var title = template.metadata.name.split(':')[0];
            var description = template.spec.description;

            // reset pagination to first page if one of the filters was applied
            if (!lodash.isEmpty(ctrl.searchQuery) || ctrl.selectedRuntimeFilter.id !== 'all') {
                ctrl.page.number = 0;
            }

            return lodash.isEmpty(ctrl.searchQuery) ||
                lodash.includes(title, ctrl.searchQuery) || lodash.includes(description, ctrl.searchQuery);
        }

        /**
         * Gets default selected template
         * @returns {Object} template to be set as selected
         */
        function getSelectedTemplate() {
            return lodash.keys(ctrl.templatesWorkingCopy)[0];
        }

        /**
         * Initialize object for function from template
         */
        function initFunctionData() {

            // gets all available function templates
            ctrl.getFunctionTemplates()
                .then(function (response) {
                    ctrl.templatesWorkingCopy = response;
                    ctrl.selectedTemplate = getSelectedTemplate();
                    var selectedTemplate = ctrl.templatesWorkingCopy[ctrl.selectedTemplate];
                    ctrl.functionData = angular.copy(selectedTemplate);

                    lodash.assign(ctrl.functionData.metadata, {
                        name: ctrl.functionName
                    });

                    templatesOriginalObject = angular.copy(ctrl.templatesWorkingCopy);
                    ctrl.runtimeFilters = getRuntimeFilters();

                    initPagination();
                })
                .catch(function (error) {
                    var msg = 'Oops: Unknown error occurred while getting function\'s templates';

                    DialogsService.alert(lodash.get(error, 'data.error', msg));
                })
                .finally(function () {
                    ctrl.toggleSplashScreen({value: false});
                });
        }

        /**
         * Init data for pagination
         */
        function initPagination() {
            ctrl.page = {
                number: 0,
                size: 8
            };

            paginateTemplates();
        }

        /**
         * Gets runtime filters
         * @returns {Array}
         */
        function getRuntimeFilters() {
            return [
                {
                    id: 'all',
                    name: 'All',
                    visible: true
                },
                {
                    id: 'golang',
                    name: 'Go',
                    visible: true
                },
                {
                    id: 'python:2.7',
                    name: 'Python 2.7',
                    visible: true
                },
                {
                    id: 'python:3.6',
                    name: 'Python 3.6',
                    visible: true
                },
                {
                    id: 'pypy',
                    name: 'PyPy',
                    visible: true
                },
                {
                    id: 'dotnetcore',
                    name: '.NET Core',
                    visible: true
                },
                {
                    id: 'java',
                    name: 'Java',
                    visible: true
                },
                {
                    id: 'nodejs',
                    name: 'NodeJS',
                    visible: true
                },
                {
                    id: 'shell',
                    name: 'Shell',
                    visible: true
                },
                {
                    id: 'ruby',
                    name: 'Ruby',
                    visible: true
                }
            ];
        }

        /**
         * Paginates function's templates
         */
        function paginateTemplates() {

            // amount of visible items on one page
            var PAGE_SIZE = 8;

            ctrl.templatesWorkingCopy = lodash.chain(templatesOriginalObject)
                .filter(filterByRuntime)
                .filter(filterByTitleAndDescription)
                .thru(function (filteredTemplates) {
                    ctrl.page.total = Math.ceil(lodash.size(filteredTemplates) / PAGE_SIZE);

                    return lodash.slice(filteredTemplates, (ctrl.page.number * PAGE_SIZE), (ctrl.page.number * PAGE_SIZE) + PAGE_SIZE);
                })
                .keyBy(function (template) {
                    return template.metadata.name.split(':')[0] + ' (' + template.spec.runtime + ')';
                })
                .value();
        }
    }
}());
