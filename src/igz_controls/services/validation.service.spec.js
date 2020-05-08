describe('ValidationService: ', function () {
    var ValidationService;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_ValidationService_) {
            ValidationService = _ValidationService_;
        });
    });

    afterEach(function () {
        ValidationService = null;
    });

    describe('getMaxLength(): ', function () {
        it('should return default maximum length of 128 px for unknown field names', function () {
            var result = ValidationService.getMaxLength('test.name');
            expect(result).toEqual(128);
        });

        it('should return maximum length for known field name', function () {
            var result = ValidationService.getMaxLength('default');
            expect(result).toEqual(128);
        });
    });
});
