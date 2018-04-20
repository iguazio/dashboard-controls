describe('ConvertorService: ', function () {
    var ConvertorService;

    beforeEach(function () {
        module('iguazio.app');

        inject(function (_ConvertorService_) {
            ConvertorService = _ConvertorService_;
        });
    });

    afterEach(function () {
        ConvertorService = null;
    });

    describe('getConvertedBytes(): ', function () {
        it('should return default object when no params passed', function () {
            var result = ConvertorService.getConvertedBytes();
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1025, label: 'GB/s', pow: 3}));
        });

        it('should return default object when 0 param passed', function () {
            var result = ConvertorService.getConvertedBytes(0);
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1025, label: 'GB/s', pow: 3}));
        });

        it('should return default object when incorrect param passed', function () {
            var result = ConvertorService.getConvertedBytes('1024 bytes');
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1025, label: 'GB/s', pow: 3}));
        });

        it('should return correct result object', function () {
            var result = ConvertorService.getConvertedBytes(1024);
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1, label: 'KB/s', pow: 1}));
        });

        it('should return maximum available value 1024 GB/s', function () {
            var result = ConvertorService.getConvertedBytes(1125899906842624);
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1024, label: 'GB/s', pow: 3}));
        });
    });
});