describe('igzDuplicateDialog component:', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var $state;
    var ctrl;
    var ApiGatewaysDataService;
    var DialogsService;
    var LoginService;
    var apiGateway;
    var duplicateForm;
    var error;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _$state_, _$timeout_, _DialogsService_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $state = _$state_;
            DialogsService = _DialogsService_;
        });

        ApiGatewaysDataService = {
            createApiGateway: $q.when.bind($q)
        };
        LoginService = {
            getUsername: angular.noop
        };
        apiGateway = {
            spec: {
                name: 'apiGateway'
            },
            meta: {
                name: 'apiGateway',
                labels: {
                    entries: [
                        {
                            key: 'username',
                            value: 'user'
                        },
                        {
                            key: 'project-name',
                            value: 'project'
                        }
                    ]
                }
            }
        };
        duplicateForm = {
            $setSubmitted: angular.noop,
            $valid: true
        };
        error = {
            statusText: 'errorMessage',
            status: 404
        };

        var bindings = {
            apiGateway: apiGateway,
            addNewApiGatewayCallback: $q.when.bind($q),
            closeDialog: angular.noop,
            getFunction: $q.when.bind($q)
        };
        var element = angular.element('<igz-duplicate-dialog></igz-duplicate-dialog>');
        ctrl = $componentController('igzDuplicateDialog', {$element: element, ApiGatewaysDataService: ApiGatewaysDataService, LoginService: LoginService}, bindings);
        ctrl.duplicateForm = duplicateForm;
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        $state = null;
        ctrl = null;
        DialogsService = null;
    });

    describe('onInit(): ', function () {
        it('should should set initial values for duplicate function dialog', function () {
            ctrl.apiGateway = null;

            ctrl.$onInit();

            expect(ctrl.dialogTitle).toEqual('DUPLICATE_FUNCTION');
            expect(ctrl.inputLabel).toEqual('FUNCTION_NAME');
            expect(ctrl.inputPlaceholder).toEqual('PLACEHOLDER.ENTER_FUNCTION_NAME');
        });

        it('should set initial values for duplicate API gateway dialog', function () {
            ctrl.apiGateway = apiGateway;

            ctrl.$onInit();

            expect(ctrl.dialogTitle).toEqual('DUPLICATE_API_GATEWAY');
            expect(ctrl.inputLabel).toEqual('API_GATEWAY_NAME');
            expect(ctrl.inputPlaceholder).toEqual('PLACEHOLDER.ENTER_API_GATEWAY_NAME');
        });

        it('should set initial values for validation rules', function () {
            ctrl.$onInit();

            expect(ctrl.versionActions).not.toBe([]);
        });
    });

    describe('duplicate(): ', function () {
        it('should call getFunction method', function () {
            spyOn(ctrl, 'getFunction').and.returnValue($q.reject(error));
            spyOn(ctrl, 'closeDialog').and.callThrough();

            ctrl.apiGateway = null;
            ctrl.newItemName = 'newName';

            ctrl.$onInit();
            ctrl.duplicateForm.$setSubmitted();
            ctrl.duplicate();
            $rootScope.$digest();

            expect(ctrl.getFunction).toHaveBeenCalledWith({metadata: {name: ctrl.newItemName}});
            expect(ctrl.closeDialog).toHaveBeenCalled();
        });

        it('should call getFunction method and open alert dialog', function () {
            spyOn(ctrl, 'getFunction').and.returnValue($q.resolve());
            spyOn(DialogsService, 'alert').and.callThrough();
            ctrl.apiGateway = null;
            ctrl.newItemName = 'newName';

            ctrl.$onInit();
            ctrl.duplicateForm.$setSubmitted();
            ctrl.duplicate();
            $rootScope.$digest();

            expect(ctrl.getFunction).toHaveBeenCalledWith({metadata: {name: ctrl.newItemName}});
            expect(DialogsService.alert).toHaveBeenCalledWith('ERROR_MSG.FUNCTION_NAME_ALREADY_IN_USE');
        });

        it('should call createApiGateway method', function () {
            var response = {id: '1111-1111-1111-1111'};
            spyOn(ApiGatewaysDataService, 'createApiGateway').and.returnValue($q.when(response));
            spyOn(ctrl, 'addNewApiGatewayCallback').and.callThrough();
            spyOn(ctrl, 'closeDialog');
            ctrl.apiGateway = apiGateway;
            ctrl.newItemName = 'apiGateway';

            ctrl.$onInit();
            ctrl.duplicateForm.$setSubmitted();
            ctrl.duplicate();
            $rootScope.$digest();

            expect(ApiGatewaysDataService.createApiGateway).toHaveBeenCalledWith(ctrl.apiGateway, 'project');
            expect(ctrl.addNewApiGatewayCallback).toHaveBeenCalledWith({taskId: response.id, newApiGateway: ctrl.apiGateway});
            expect(ctrl.closeDialog).toHaveBeenCalled();
        });

        it('should call createApiGateway method and open alert dialog', function () {
            spyOn(ApiGatewaysDataService, 'createApiGateway').and.returnValue($q.reject(error));
            spyOn(ctrl, 'addNewApiGatewayCallback').and.callThrough();
            spyOn(DialogsService, 'alert').and.callThrough();
            ctrl.apiGateway = apiGateway;
            ctrl.newItemName = 'apiGateway';

            ctrl.$onInit();
            ctrl.duplicateForm.$setSubmitted();
            ctrl.duplicate();
            $rootScope.$digest();

            expect(ApiGatewaysDataService.createApiGateway).toHaveBeenCalledWith(ctrl.apiGateway, 'project');
            expect(DialogsService.alert).toHaveBeenCalledWith('errorMessage');

        });
    });

    describe('onClose(): ', function () {
        it('should close dialog calling closeDialog() method', function () {
            spyOn(ctrl, 'closeDialog');

            ctrl.onClose();

            expect(ctrl.closeDialog).toHaveBeenCalled();
        });
    });

    describe('inputValueCallback(): ', function () {
        it('should set new data for ctrl.newItemName', function () {
            ctrl.inputValueCallback('newName');

            expect(ctrl.newItemName).toEqual('newName');
        });
    });
});
