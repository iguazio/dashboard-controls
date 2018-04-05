describe('ValidatingPatternsService: ', function () {
    var ValidatingPatternsService;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_ValidatingPatternsService_) {
            ValidatingPatternsService = _ValidatingPatternsService_;
        });
    });

    afterEach(function () {
        ValidatingPatternsService = null;
    });

    describe('getMaxLength(): ', function () {
        it('should return default maximum length of 128 px for unknown field names', function () {
            var result = ValidatingPatternsService.getMaxLength('test.name');
            expect(result).toEqual(128);
        });

        it('should return maximum length for known field name', function () {
            var result = ValidatingPatternsService.getMaxLength('default');
            expect(result).toEqual(128);
        });
    });
});