describe('nclProjectsTableRow component:', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var ActionCheckboxAllService;
    var DialogsService;
    var ctrl;
    var project;
    var projectsList;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _ActionCheckboxAllService_, _DialogsService_) {
            $rootScope = _$rootScope_;
            $componentController = _$componentController_;
            $q = _$q_;
            ActionCheckboxAllService = _ActionCheckboxAllService_;
            DialogsService = _DialogsService_;
        });

        project = {
            metadata: {
                name: 'my-project-1',
                namespace: 'nuclio'
            },
            spec: {
                description: 'Some description'
            },
            ui: {
                checked: false
            }
        };
        projectsList = [
            {
                metadata: {
                    name: 'my-project-1',
                    namespace: 'nuclio'
                },
                spec: {
                    description: 'Some description'
                },
                ui: {
                    checked: false
                }
            },
            {
                metadata: {
                    name: 'my-project-2',
                    namespace: 'nuclio'
                },
                spec: {
                    description: 'Some description'
                },
                ui: {
                    checked: false
                }
            }
        ];
        var bindings = {
            project: project,
            projectsList: angular.copy(projectsList),
            deleteProject: $q.when.bind($q),
            actionHandlerCallback: angular.noop
        };

        ctrl = $componentController('nclProjectsTableRow', null, bindings);
        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        ctrl = null;
        ActionCheckboxAllService = null;
        DialogsService = null;
    });

    describe('$onInit(): ', function () {
        it('should initialize `deleteProject`, `editProjects` actions and assign them to `ui` property of current project' +
           'should initialize `checked` status to `false`', function () {

            expect(ctrl.project.ui.checked).toBeFalsy();
        });
    });

    describe('showDetails(): ', function () {

        // todo
    });

    describe('deleteProject(): ', function () {
        it('should resolve `ctrl.deleteProject()` method if there is error ' +
            '(missing mandatory fields) is response', function () {
            spyOn(ctrl, 'deleteProject').and.callThrough();

            ctrl.project.ui.delete();
            $rootScope.$digest();
            project.ui = ctrl.project.ui;

            expect(ctrl.deleteProject).toHaveBeenCalledWith({ project: ctrl.project });
        });

        // todo error status cases
        it('should resolve `ctrl.deleteProject()` method if there is error ' +
            '(missing mandatory fields) is response', function () {
            spyOn(ctrl, 'deleteProject').and.returnValue($q.reject());

            ctrl.project.ui.delete();
            $rootScope.$digest();
            project.ui = ctrl.project.ui;

            expect(ctrl.deleteProject).toHaveBeenCalledWith({ project: ctrl.project });
        });
    });

    describe('editProject(): ', function () {
        // todo
    });

    describe('onFireAction(): ', function () {
        it('should call actionHandlerCallback() method', function () {
            spyOn(ctrl, 'actionHandlerCallback');

            ctrl.onFireAction('delete');
            ctrl.onFireAction('edit');
            ctrl.onFireAction('export');

            expect(ctrl.actionHandlerCallback).toHaveBeenCalledTimes(3);
        });
    });
});
