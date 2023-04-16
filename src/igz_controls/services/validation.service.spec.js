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

    describe('isValidByRules', () => {
        it('should return true when given an empty rules array', () => {
            expect(ValidationService.isValidByRules([], 'test')).toBe(true);
        });

        it('should return true when given a single rule that matches the value', () => {
            var rules = [
                {
                    pattern: /^test$/,
                },
            ];
            expect(ValidationService.isValidByRules(rules, 'test')).toBe(true);
        });

        it('should return false when given a single rule that does not match the value', () => {
            var rules = [
                {
                    pattern: /^test$/,
                },
            ];
            expect(ValidationService.isValidByRules(rules, 'notTest')).toBe(false);
        });

        it('should return true when given multiple rules that all match the value', () => {
            var rules = [
                {
                    pattern: /^t/,
                },
                {
                    pattern: /e/,
                },
                {
                    pattern: /s/,
                },
                {
                    pattern: /t$/,
                },
            ];
            expect(ValidationService.isValidByRules(rules, 'test')).toBe(true);
        });

        it('should return false when given multiple rules and one does not match the value', () => {
            var rules = [
                {
                    pattern: /^t/,
                },
                {
                    pattern: /e/,
                },
                {
                    pattern: /s/,
                },
                {
                    pattern: /t$/,
                },
            ];
            expect(ValidationService.isValidByRules(rules, 'notTest')).toBe(false);
        });

        it('should call the pattern function when given a function rule', () => {
            var patternFn = jasmine.createSpy('patternFn').and.returnValue(true);
            var rules = [
                {
                    pattern: patternFn,
                },
            ];
            ValidationService.isValidByRules(rules, 'test');
            expect(patternFn).toHaveBeenCalledWith('test');
        });
    });
});
