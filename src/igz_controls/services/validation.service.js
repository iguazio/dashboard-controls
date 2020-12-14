(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ValidationService', ValidationService);

    function ValidationService($i18next, i18next, lodash) {
        var lng = i18next.language;

        var lengths = {
            default: 128,
            k8s: {
                configMapKey: 253,
                dns1035Label: 63,
                dns1123Label: 63,
                dns1123Subdomain: 253,
                prefixedQualifiedName: 253,
                qualifiedName: 63,
                wildcardDns1123Subdomain: 253
            },
            function: {
                name: 56,
                label: {
                    key: 250
                },
                eventName: 128,
                imageName: 255,
                itemPath: 255,
                containerSubPath: 255,
                triggerName: 128,
                v3ioConsumerGroupName: 256
            },
            apiGateway: {
                name: 63
            },
            service: {
                name: 53,
                resources: 253,
                persistentVolumeClaims: {
                    value: 255
                }
            },
            container: {
                name: 128,
                description: 150,
                alias: 40,
                ruleName: 128,
                email: 100,
                http: 100,
                sms: 19,
                stream: -1,
                attribute: {
                    name: 256,
                    string: 512
                },
                fileEdit: {
                    fieldName: 128,
                    fieldDescription: 128,
                    geohash: 8,
                    id: 36,
                    negativeInteger: 9,
                    email: 40,
                    custom: 100
                }
            },
            cluster: {
                name: 128,
                description: 150,
                node: {
                    name: 128,
                    description: 128
                }
            },
            storagePool: {
                name: 30,
                description: 150,
                url: 100
            },
            network: {
                name: 30,
                description: 150
            },
            identity: {
                user: {
                    name: 30,
                    username: 32,
                    email: 128,
                    position: 128,
                    department: 128
                },
                group: {
                    name: 128,
                    description: 128
                }
            },
            tenant: {
                name: 31,
                email: 128
            },
            events: {
                escalation: {
                    name: 40
                }
            },
            phone: 17
        };
        var generateRule = {
            beginWith: function (chars) {
                return {
                    name: 'begin',
                    label: $i18next.t('common:BEGIN_WITH', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('^[' + convertToPattern(chars) + ']')
                };
            },
            beginNotWith: function (chars) {
                return {
                    name: 'beginNot',
                    label: $i18next.t('common:BEGIN_NOT_WITH', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('^[^' + convertToPattern(chars) + ']')
                };
            },
            endWith: function (chars) {
                return {
                    name: 'end',
                    label: $i18next.t('common:END_WITH', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('[' + convertToPattern(chars) + ']$')
                };
            },
            endNotWith: function (chars) {
                return {
                    name: 'endNot',
                    label: $i18next.t('common:END_NOT_WITH', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('[^' + convertToPattern(chars) + ']$')
                };
            },
            beginEndWith: function (chars) {
                var convertedPattern = convertToPattern(chars);

                return {
                    name: 'beginEnd',
                    label: $i18next.t('common:BEGIN_END_WITH', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('^([' + convertedPattern + '].*)?[' + convertedPattern + ']$')
                };
            },
            beginEndNotWith: function (chars) {
                var convertedPattern = convertToPattern(chars);

                return {
                    name: 'beginEndNot',
                    label: $i18next.t('common:BEGIN_END_NOT_WITH', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('^([^' + convertedPattern + '].*)?[^' + convertedPattern + ']$')
                };
            },
            onlyAtTheBeginning: function (chars) {
                var convertedPattern = convertToPattern(chars);

                return {
                    name: 'onlyAtTheBeginning',
                    label: $i18next.t('common:ONLY_AT_THE_BEGINNING', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('^([' + convertedPattern + '])?[^' + convertedPattern + ']+$')
                };
            },
            validCharacters: function (chars) {
                return {
                    name: 'validCharacters',
                    label: $i18next.t('common:VALID_CHARACTERS', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('^[' + convertToPattern(chars) + ']+$')
                };
            },
            noConsecutiveCharacters: function (chars) {
                var convertedPattern = chars.split(' ').map(function (charPair) {
                    var charsPairArray = charPair.split('');

                    return '(?!.*' + '\\' + charsPairArray[0] + '\\' + charsPairArray[1] + ')';
                }).join('');

                return {
                    name: 'noConsecutiveCharacters',
                    label: $i18next.t('common:NO_CONSECUTIVE_CHARACTER', { lng: lng }) + ': ' + convertToLabel(chars),
                    pattern: new RegExp('^' + convertedPattern)
                };
            },
            maxLengthBetweenDelimiters: function (delimiter, maxLength, delimiterDescription) {
                return {
                    name: 'labelsLength',
                    label: $i18next.t('common:MAX_LENGTH_BETWEEN_DELIMITER', {
                        lng: lng,
                        delimiter: lodash.defaultTo(delimiterDescription, delimiter),
                        maxLength: maxLength
                    }),
                    pattern: function (value) {
                        return value.split(delimiter).every(function (item) {
                            return item.length >= 1 && item.length <= maxLength;
                        });
                    }
                };
            },
            mustNotBe: function (words) {
                var wordsArray = words.split(' ');

                return {
                    name: 'mustNotBe',
                    label: $i18next.t('common:MUST_NOT_BE', { lng: lng }) + ': ' + convertToLabel(words),
                    pattern: function (value) {
                        return !lodash.includes(wordsArray, value);
                    }
                };
            },
            length: function (options) {
                var min = Number.isSafeInteger(options.min) ? options.min : 0;
                var max = Number.isSafeInteger(options.max) ? options.max : '';

                if (min || max) {
                    var label = $i18next.t('common:LENGTH', { lng: lng }) + ' – ' +
                        (min ? 'min: ' + options.min + '\xa0\xa0' : '') + (max ? 'max: ' + options.max : '');

                    return {
                        name: 'length',
                        label: label,
                        pattern: new RegExp('^[\\S\\s]{' + min + ',' + max + '}$')
                    };
                }
            }
        };
        var commonRules = {
            integer: [
                generateRule.validCharacters('0-9'),
                {
                    name: 'beginNot',
                    label: $i18next.t('common:BEGIN_NOT_WITH', { lng: lng }) + ': 0',
                    pattern: /^(?!0.+)/
                }
            ],
            negativeInteger: [
                generateRule.validCharacters('0-9 -'),
                generateRule.onlyAtTheBeginning('-'),
                {
                    name: 'beginNot',
                    label: $i18next.t('common:BEGIN_NOT_WITH', { lng: lng }) + ': 0',
                    pattern: /^(?![-]0)(?!0.+)/
                }
            ],
            email: [
                generateRule.beginEndNotWith('@ .'),
                {
                    name: 'exactlyOne',
                    label: $i18next.t('common:MUST_CONTAIN_EXACTLY_ONE', { lng: lng }) + ': @',
                    pattern: /^[^@]+@[^@]+$/
                },
                {
                    name: 'dotAfterAt',
                    label: $i18next.t('common:MUST_HAVE_DOT_AFTER_AT', { lng: lng }),
                    pattern: /@.+\..+$/
                }
            ],
            dns1035Label: [
                generateRule.validCharacters('a-z 0-9 -'),
                generateRule.beginWith('a-z'),
                generateRule.endWith('a-z 0-9')
            ],
            prefixedQualifiedName: [
                {
                    name: 'nameValidCharacters',
                    label: '[' + $i18next.t('common:NAME', { lng: lng }) + '] ' +
                        $i18next.t('common:VALID_CHARACTERS', { lng: lng }) + ': a–z, A–Z, 0–9, –, _, .',
                    pattern: /^([^/]+\/)?[\w.-]+$/
                },
                {
                    name: 'nameBeginEnd',
                    label: '[' + $i18next.t('common:NAME', { lng: lng }) + '] ' +
                        $i18next.t('common:BEGIN_END_WITH', { lng: lng }) + ': a–z, A–Z, 0–9',
                    pattern: /^([^/]+\/)?([A-Za-z0-9][^/]*)?[A-Za-z0-9]$/
                },
                {
                    name: 'nameMaxLength',
                    label: '[' + $i18next.t('common:NAME', { lng: lng }) + '] ' +
                        $i18next.t('common:MAX_LENGTH_CHARACTERS', { lng: lng, count: 63 }),
                    pattern: /^([^/]+\/)?[^/]{1,63}$/
                },
                {
                    name: 'prefixValidCharacters',
                    label: '[' + $i18next.t('functions:PREFIX', { lng: lng }) + '] ' +
                        $i18next.t('common:VALID_CHARACTERS', { lng: lng }) + ': a–z, 0–9, –, .',
                    pattern: /^([a-z0-9.-]+\/)?[^/]+$/
                },
                {
                    name: 'prefixBeginEnd',
                    label: '[' + $i18next.t('functions:PREFIX', { lng: lng }) + '] ' +
                        $i18next.t('common:BEGIN_END_WITH', { lng: lng }) + ': a–z, 0–9',
                    pattern: /^([a-z0-9]([^/]*[a-z0-9])?\/)?[^/]+$/
                },
                {
                    name: 'prefixNotStart',
                    label: '[' + $i18next.t('functions:PREFIX', { lng: lng }) + '] ' +
                        $i18next.t('functions:NOT_START_WITH_FORBIDDEN_WORDS', { lng: lng }),
                    pattern: /^(?!kubernetes\.io\/)(?!k8s\.io\/)(?!nuclio\.io\/)/
                },
                {
                    name: 'prefixMaxLength',
                    label: '[' + $i18next.t('functions:PREFIX', { lng: lng }) + '] ' +
                        $i18next.t('common:MAX_LENGTH_CHARACTERS',
                                   { lng: lng, count: lengths.k8s.prefixedQualifiedName }),
                    pattern: /^(?![^/]{254,}\/)/
                }
            ]
        };
        var validationRules = {
            k8s: {
                configMapKey: [
                    generateRule.validCharacters('a-z A-Z 0-9 - _ .'),
                    generateRule.length({ max: lengths.k8s.configMapKey })
                ],
                dns1035Label: commonRules.dns1035Label.concat(generateRule.length({ max: lengths.k8s.dns1035Label })),
                dns1123Label: [
                    generateRule.validCharacters('a-z 0-9 -'),
                    generateRule.beginEndWith('a-z 0-9'),
                    generateRule.length({ max: lengths.k8s.dns1123Label })
                ],
                dns1123Subdomain: [
                    generateRule.validCharacters('a-z 0-9 - .'),
                    generateRule.beginEndWith('a-z 0-9'),
                    generateRule.noConsecutiveCharacters('.. .- -.'),
                    generateRule.maxLengthBetweenDelimiters('.',
                                                            lengths.k8s.dns1123Label,
                                                            $i18next.t('common:PERIODS', { lng: lng })),
                    generateRule.length({ max: lengths.k8s.dns1123Subdomain })
                ],
                envVarName: [
                    generateRule.validCharacters('a-z A-Z 0-9 - _ .'),
                    generateRule.beginNotWith('0-9 .')
                ],
                prefixedQualifiedName: commonRules.prefixedQualifiedName,
                qualifiedName: [
                    generateRule.validCharacters('a-z A-Z 0-9 - _ .'),
                    generateRule.beginEndWith('a-z A-Z 0-9'),
                    generateRule.length({ max: lengths.k8s.qualifiedName })
                ],
                wildcardDns1123Subdomain: [
                    generateRule.validCharacters('a-z A-Z 0-9 - . *'),
                    {
                        name: 'begin',
                        label: $i18next.t('common:BEGIN_WITH', { lng: lng }) + ': *.',
                        pattern: /^\*\..*$/
                    },
                    generateRule.onlyAtTheBeginning('*'),
                    generateRule.endWith('a-z 0-9'),
                    generateRule.noConsecutiveCharacters('.. .- -.'),
                    generateRule.maxLengthBetweenDelimiters('.',
                                                            lengths.k8s.dns1123Label,
                                                            $i18next.t('common:PERIODS', { lng: lng })),
                    generateRule.length({ max: lengths.k8s.wildcardDns1123Subdomain })
                ]
            },
            function: {
                name: commonRules.dns1035Label.concat(
                    generateRule.mustNotBe('dashboard controller dlx scaler'),
                    generateRule.length({ max: lengths.function.name })
                ),
                label: {
                    key: commonRules.prefixedQualifiedName.concat(generateRule.length({
                        max: lengths.function.label.key
                    }))
                },
                itemPath: [generateRule.length({ max: lengths.function.itemPath })],
                subscriptionQoS: [
                    generateRule.validCharacters('0-2'),
                    generateRule.length({ max: 1 })
                ],
                arrayInt: [
                    generateRule.validCharacters('0-9 - ,'),
                    generateRule.beginEndWith('0-9'),
                    generateRule.noConsecutiveCharacters(',-')
                ],
                ingressHostPath: [
                    generateRule.beginWith('/')
                ],
                interval: [
                    {
                        name: 'validCharacters',
                        label: $i18next.t('common:VALID_CHARACTERS', { lng: lng }) + ': 0–9, m, s, h',
                        pattern: /^[0-9msh]+$/
                    },
                    generateRule.beginWith('0-9'),
                    {
                        name: 'end',
                        label: $i18next.t('common:END_WITH', { lng: lng }) + ': ms, s, m, h',
                        pattern: /\d+(ms|[smh])$/
                    }
                ],
                triggerName: [
                    generateRule.validCharacters('a-z A-Z 0-9 - _'),
                    generateRule.beginWith('a-z A-Z'),
                    generateRule.length({ max: lengths.function.triggerName })
                ],
                v3ioConsumerGroupName: [
                    generateRule.validCharacters('a-z A-Z 0-9 _'),
                    generateRule.beginWith('a-z A-Z _'),
                    generateRule.length({ max: lengths.function.v3ioConsumerGroupName })
                ]
            },
            apiGateway: {
                name: commonRules.dns1035Label.concat(
                    generateRule.mustNotBe('dashboard controller dlx scaler'),
                    generateRule.length({ max: lengths.apiGateway.name })
                )
            },
            service: {
                name: commonRules.dns1035Label.concat(generateRule.length({ max: lengths.service.name })),
                resources: {
                    configuration: [
                        generateRule.validCharacters('a-z A-Z 0-9 - _ .'),
                        generateRule.beginNotWith('.'),
                        generateRule.length({ max: lengths.service.resources })
                    ],
                    catalog: [
                        generateRule.validCharacters('a-z 0-9 - _ .'),
                        generateRule.beginNotWith('.'),
                        generateRule.length({ max: lengths.service.resources })
                    ]
                },
                persistentVolumeClaims: {
                    value: [generateRule.length({ max: lengths.service.persistentVolumeClaims.value })]
                },
                hiveMetastorePath: [generateRule.endNotWith('/')]
            },
            container: {
                name: [
                    generateRule.validCharacters('a-z 0-9 - _'),
                    generateRule.beginEndWith('a-z 0-9'),
                    generateRule.noConsecutiveCharacters('--'),
                    generateRule.noConsecutiveCharacters('__'),
                    {
                        name: 'atLeastOneLowercaseLetter',
                        label: $i18next.t('common:CONTAIN_LOWERCASE_LETTER', { lng: lng }) + ': a–z',
                        pattern: /^(?=.*[a-z])/
                    },
                    generateRule.length({ max: lengths.container.name })
                ],
                attribute: {
                    name: [
                        generateRule.validCharacters('a-z A-Z 0-9 _'),
                        generateRule.beginWith('a-z A-Z _'),
                        generateRule.length({ max: lengths.container.attribute.name })
                    ]
                },
                fileEdit: {
                    geohash: [
                        generateRule.validCharacters('a-z 0-9'),
                        generateRule.length({ max: lengths.container.fileEdit.geohash })
                    ],
                    id: [
                        generateRule.validCharacters('a-z A-Z 0-9 -'),
                        generateRule.length({ max: lengths.container.fileEdit.id })
                    ],
                    negativeInteger: commonRules.negativeInteger.concat(generateRule.length({
                        max: lengths.container.fileEdit.negativeInteger
                    })),
                    email: commonRules.email.concat(generateRule.length({ max: lengths.container.fileEdit.email })),
                    custom: [
                        generateRule.validCharacters('a-z A-Z 0-9 - _ . , s'),
                        generateRule.length({ max: lengths.container.fileEdit.custom })
                    ]
                },
                email: commonRules.email.concat(generateRule.length({ max: lengths.container.email })),
                minTimeToHoldInNewTier: commonRules.integer.concat(generateRule.length({ max: 3 })),
                fullBackupOnEvery: commonRules.integer.concat(generateRule.length({ max: 2 })),
                deleteFilesOlderThan: commonRules.integer.concat(generateRule.length({ max: 3 })),
                alias: [
                    generateRule.validCharacters('a-z A-Z 0-9 - _'),
                    generateRule.length({ max: lengths.container.alias })
                ]
            },
            storagePool: {
                name: [
                    generateRule.validCharacters('a-z A-Z 0-9 _'),
                    generateRule.length({ max: lengths.storagePool.name })
                ]
            },
            network: {
                name: [
                    generateRule.validCharacters('a-z A-Z 0-9 - . ( ) \\ / : s'),
                    generateRule.length({ max: lengths.network.name })
                ]
            },
            identity: {
                user: {
                    name: [
                        generateRule.validCharacters('a-z A-Z - s'),
                        generateRule.beginWith('a-z A-Z'),
                        generateRule.length({ max: lengths.identity.user.name })
                    ],
                    username: [
                        generateRule.validCharacters('a-z A-Z 0-9 - _'),
                        generateRule.beginWith('a-z A-Z'),
                        generateRule.length({ max: lengths.identity.user.username })
                    ],
                    email: commonRules.email.concat(generateRule.length({ max: lengths.identity.user.email })),
                    position: [generateRule.length({ max: lengths.identity.user.position })],
                    department: [generateRule.length({ max: lengths.identity.user.department })]
                },
                address: [
                    {
                        name: 'begin',
                        label: $i18next.t('common:BEGIN_WITH', { lng: lng }) + ': ldaps://, ldap://' ,
                        pattern: /^ldaps?:\/\//
                    }
                ]
            },
            tenant: {
                name: [
                    generateRule.validCharacters('a-z A-Z 0-9 _'),
                    generateRule.beginWith('a-z A-Z'),
                    generateRule.endWith('a-z A-Z 0-9'),
                    generateRule.length({ max: lengths.tenant.name })
                ],
                email: commonRules.email.concat(generateRule.length({ max: lengths.tenant.email }))
            },
            events: {
                escalation: {
                    name: [
                        generateRule.validCharacters('a-z A-Z 0-9 - . ( ) \\ / : s'),
                        generateRule.length({ max: lengths.events.escalation.name })
                    ]
                }
            },
            integer: commonRules.integer,
            negativeInteger: commonRules.negativeInteger,
            negativeFloat: [
                generateRule.validCharacters('0-9 . -'),
                generateRule.onlyAtTheBeginning('-'),
                generateRule.endWith('0-9'),
                {
                    name: 'maxLengthWholePart',
                    label: $i18next.t('common:MAX_LENGTH_WHOLE_PART', { lng: lng, length: 9 }),
                    pattern: /^[-]?[\d]{1,9}(\..*)?$/
                },
                {
                    name: 'maxLengthDecimalPart',
                    label: $i18next.t('common:MAX_LENGTH_DECIMAL_PART', { lng: lng, length: 2 }),
                    pattern: /^[-]?(\d+(\.\d{1,2})?)$/
                }
            ],
            floatingPoint: [
                generateRule.validCharacters('0-9 . + - e E'),
                {
                    name: 'onlyAtTheBeginning',
                    label: $i18next.t('common:ONLY_AT_THE_BEGINNING_AND_EXPONENT', { lng: lng }),
                    pattern: /^[-+]?[^-+]+([eE].+)?$/
                },
                generateRule.beginWith('0-9 + -'),
                generateRule.endWith('0-9'),
                {
                    name: 'invalidExponent',
                    label: $i18next.t('common:EXPONENT_IS_INVALID', { lng: lng }),
                    pattern: /^[-+]?[^eE]+([eE][-+]?[0-9]+)?$/
                }

            ],
            number: [
                generateRule.validCharacters('0-9')
            ],
            email: commonRules.email,
            path: [
                generateRule.validCharacters('a-z A-Z - _ /'),
                generateRule.beginWith('/'),
                generateRule.endWith('a-z A-Z')
            ],
            phone: [
                generateRule.validCharacters('0-9 + -'),
                generateRule.onlyAtTheBeginning('+'),
                generateRule.beginWith('0-9 +'),
                generateRule.endWith('0-9'),
                generateRule.length({ min: 4, max: lengths.phone })
            ]
        };

        return {
            storage: /^[a-zA-Z0-9]+?:\/\/[a-zA-Z0-9_.-]+?:[a-zA-Z0-9_./-]+?@[a-zA-Z0-9_.-]+?$/,
            url: /^[a-zA-Z0-9]+?:\/\/[a-zA-Z0-9_.-]+?:[a-zA-Z0-9_\-.]+?@[a-zA-Z0-9_.-]+?$/,
            timestamp: /^(?:\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\d|3[0-1])T(?:[0-1]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?((?:[+-](?:[0-1]\d|2[0-3]):[0-5]\d)|Z)?$/,
            ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            mask: /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/,
            hostName_IpAddress: /(^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$)|(^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9])$)/,
            dockerReference: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]))*(:\d+)?\/)?[a-z0-9]+(([._]|__|[-]*)[a-z0-9]+)*(\/[a-z0-9]+(([._]|__|[-]*)[a-z0-9]+)*)*(:[\w][\w.-]{0,127})?(@[A-Za-z][A-Za-z0-9]*([-_+.][A-Za-z][A-Za-z0-9]*)*:[0-9a-fA-F]{32,})?$/,

            getMaxLength: getMaxLength,
            getValidationRules: getValidationRules
        };

        //
        // Public methods
        //

        /**
         * Provides maximum length of text that can be filled in input
         * @param {string} path - path to field
         * @returns {number}
         */
        function getMaxLength(path) {
            return lodash.cloneDeep(lodash.get(lengths, path, lengths.default));
        }

        /**
         * Returns the list of validation rules for `type`, optionally appending provided additional rules.
         * @param {string} type - The property path to the list of validation rules.
         * @param {Array.<Object>} [additionalRules] - Additional rules to append.
         * @returns {Array.<Object>} the rule list of type `type` with `additionalRules` appended to it if provided.
         */
        function getValidationRules(type, additionalRules) {
            return lodash.chain(validationRules)
                .get(type)
                .defaultTo([])
                .cloneDeep()
                .concat(lodash.defaultTo(additionalRules, []))
                .value();
        }

        //
        // Private methods
        //

        /**
         * Converts characters string to readable format
         * Note: converts Hyphens to En Dashes, replaces one space with comma and space,
         *       replaces letter `s` with `spaces` word
         * @param {string} chars - characters to convert
         * @returns {string} - converted string
         * @example
         * convertToLabel('a-z A-Z - _ *');
         * // => 'a–z, A–Z, –, _, *'
         */
        function convertToLabel(chars) {
            return chars.replace(/-/g, '–')
                .replace(/\s/g, ', ')
                .replace(/\bs\b/, $i18next.t('common:SPACES', { lng: lng }));
        }

        /**
         * Converts characters string to valid RegExp string that will be placed into RegExp pattern
         * @param {string} chars - characters to convert
         * @returns {string} - converted string
         * @example
         * convertToPattern('a-z A-Z - _ *');
         * // => 'a-zA-Z\-\_\*'
         */
        function convertToPattern(chars) {
            return chars.split(' ').map(function (patternItem) {
                return patternItem.length === 1 ? '\\' + patternItem : patternItem;
            }).join('');
        }
    }
}());
