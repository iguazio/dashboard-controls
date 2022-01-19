describe('MaskService: ', function () {
    var MaskService;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_MaskService_) {
            MaskService = _MaskService_;
        });
    });

    afterEach(function () {
        MaskService = null;
    });

    describe('getMask(): ', function () {
        it('should return masked string', function () {
            var result = MaskService.getMask('pass1234');
            expect(result).toEqual('********');
        });
    });

    describe('getObjectWithMask(): ', function () {
        it('should return objects with masked values for given sensitive fields', function () {
            var result = MaskService.getObjectWithMask({
                    prop1: 'prop1Value',
                    prop2: {
                        sensitiveField: 'secretInfo'
                    }
                },
                ['sensitiveField']);

            expect(result).toEqual({
                prop1: 'prop1Value',
                prop2: {
                    sensitiveField: '**********'
                }
            });
        });

        it('should return object with masked value for the `password` field', function () {
            var result = MaskService.getObjectWithMask({
                    prop1: 'prop1Value',
                    password: 'pass1234'
                });

            expect(result).toEqual({
                prop1: 'prop1Value',
                password: '********'
            });
        });
    });
});
