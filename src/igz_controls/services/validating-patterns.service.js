(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .factory('ValidatingPatternsService', ValidatingPatternsService);

    function ValidatingPatternsService($i18next, i18next, lodash) {
        var lng = i18next.language;

        var lengths = {
            default: 128,
            cluster: {
                description: 150
            },
            escalation: {
                name: 40
            },
            'function': {
                name: 56
            },
            group: {
                description: 128
            },
            interface: {
                alias: 40
            },
            k8s: {
                configMapKey: 253,
                dns1035Label: 63,
                dns1123Label: 63,
                dns1123Subdomain: 253,
                prefixedQualifiedName: 253,
                qualifiedName: 63,
                wildcardDns1123Subdomain: 253
            },
            network: {
                name: 30,
                description: 150,
                subnet: 30,
                mask: 150,
                tag: 10
            },
            node: {
                description: 128
            },
            container: {
                description: 150
            },
            storagePool: {
                name: 30,
                description: 150,
                url: 100,
                username: 30
            },
            user: {
                firstName: 30,
                lastName: 30,
                username: 32
            },
            tenant: {
                name: 31
            }
        };
        var validationRules = {
            containerName: [
                {
                    name: 'maxLength',
                    label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 128}),
                    pattern: /^[\S\s]{1,128}$/
                },
                {
                    name: 'validCharacters',
                    label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, 0–9, -, _',
                    pattern: /^[-_a-z0-9]+$/
                },
                {
                    name: 'beginEnd',
                    label: $i18next.t('common:BEGIN_END_WITH_LOWERCASE_ALPHANUMERIC', {lng: lng}) + ' (a–z, 0–9)',
                    pattern: /^([a-z0-9].*)?[a-z0-9]$/
                },
                {
                    name: 'noConsecutiveHyphens',
                    label: $i18next.t('common:NO_CONSECUTIVE_CHARACTER', {lng: lng, characters: 'hyphens'}) + ' (--)',
                    pattern: /^(?!.*--)/
                },
                {
                    name: 'noConsecutiveUnderscores',
                    label: $i18next.t('common:NO_CONSECUTIVE_CHARACTER', {lng: lng, characters: 'underscores'}) + ' (__)',
                    pattern: /^(?!.*__)/
                },
                {
                    name: 'atLeastOneLowercaseLetter',
                    label: $i18next.t('common:CONTAIN_LOWERCASE_LETTER', {lng: lng}) + ' (a-z)',
                    pattern: /^(?=.*[a-z])/
                }
            ],
            'function': {
                name: []
            },
            k8s: {
                configMapKey: [
                    {
                        name: 'validCharacters',
                        label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _, .',
                        pattern: /^[-._a-zA-Z0-9]+$/
                    },
                    {
                        name: 'maxLength',
                        label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 253}),
                        pattern: /^(?=[\S\s]{1,253}$)/
                    }
                ],
                dns1035Label: [
                    {
                        name: 'validCharacters',
                        label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, 0–9, -',
                        pattern: /^[a-z0-9-]+$/
                    },
                    {
                        name: 'begin',
                        label: $i18next.t('common:BEGIN_WITH', {lng: lng, characters: 'lowercase alphabetic characters' }) + ' (a-z)',
                        pattern: /^[a-z]/
                    },
                    {
                        name: 'end',
                        label: $i18next.t('common:END_WITH', {lng: lng, characters: 'lowercase alphanumeric characters'}) + ' (a–z, 0–9)',
                        pattern: /[a-z0-9]$/
                    },
                    {
                        name: 'maxLength',
                        label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 63}),
                        pattern: /^(?=[\S\s]{1,63}$)/
                    }
                ],
                dns1123Label: [
                    {
                        name: 'validCharacters',
                        label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, 0–9, -',
                        pattern: /^[a-z0-9-]+$/
                    },
                    {
                        name: 'beginEnd',
                        label: $i18next.t('common:BEGIN_END_WITH_LOWERCASE_ALPHANUMERIC', {lng: lng}) + ' (a–z, 0–9)',
                        pattern: /^([a-z0-9].*)?[a-z0-9]$/
                    },
                    {
                        name: 'maxLength',
                        label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 63}),
                        pattern: /^(?=[\S\s]{1,63}$)/
                    }
                ],
                dns1123Subdomain: [
                    {
                        name: 'validCharacters',
                        label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, 0–9, -, .',
                        pattern: /^[a-z0-9.-]+$/
                    },
                    {
                        name: 'beginEnd',
                        label: $i18next.t('common:BEGIN_END_WITH_LOWERCASE_ALPHANUMERIC', {lng: lng}) + ' (a–z, 0–9)',
                        pattern: /^([a-z0-9].*)?[a-z0-9]$/
                    },
                    {
                        name: 'noConsecutivePeriodsOrPeriodHyphenMixes',
                        label: $i18next.t('common:NO_CONSECUTIVE_CHARACTER', {lng: lng, characters: 'periods or period/hyphen mixes'}) + ' (.., .-, -.)',
                        pattern: /^(?!.*\.\.)(?!.*\.-)(?!.*-\.)/
                    },
                    {
                        name: 'maxLength',
                        label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 253}),
                        pattern: /^(?=[\S\s]{1,253}$)/
                    }
                ],
                envVarName: [
                    {
                        name: 'validCharacters',
                        label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _, .',
                        pattern: /^[\w.-]+$/
                    },
                    {
                        name: 'beginNot',
                        label: $i18next.t('common:BEGIN_NOT_WITH', {lng: lng, characters: 'digits or periods'}) + ' (0-9, .)',
                        pattern: /^(?!\.|\d)/
                    }
                ],
                prefixedQualifiedName: [
                    {
                        name: 'nameValidCharacters',
                        label: '[' + $i18next.t('common:NAME', { lng: lng }) + '] ' +
                        $i18next.t('common:VALID_CHARACTERS', { lng: lng }) + ': a–z, A–Z, 0–9, -, _, .',
                        pattern: /^([^/]+\/)?[\w.-]+$/
                    },
                    {
                        name: 'nameBeginEnd',
                        label: '[' + $i18next.t('common:NAME', { lng: lng }) + '] ' +
                        $i18next.t('common:BEGIN_END_WITH_ALPHANUMERIC', { lng: lng }),
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
                        $i18next.t('common:VALID_CHARACTERS', { lng: lng }) + ': a–z, 0–9, -, .',
                        pattern: /^([a-z0-9.-]+\/)?[^/]+$/
                    },
                    {
                        name: 'prefixBeginEnd',
                        label: '[' + $i18next.t('functions:PREFIX', { lng: lng }) + '] ' +
                        $i18next.t('common:BEGIN_END_WITH_LOWERCASE_ALPHANUMERIC', { lng: lng }),
                        pattern: /^([a-z0-9]([^/]*[a-z0-9])?\/)?[^/]+$/
                    },
                    {
                        name: 'prefixNotStart',
                        label: '[' + $i18next.t('functions:PREFIX', { lng: lng }) + '] ' +
                        $i18next.t('functions:NOT_START_WITH_FORBIDDEN_WORDS', { lng: lng }),
                        pattern: /^(?!kubernetes\.io\/)(?!k8s\.io\/)/
                    },
                    {
                        name: 'prefixMaxLength',
                        label: '[' + $i18next.t('functions:PREFIX', { lng: lng }) + '] ' +
                        $i18next.t('common:MAX_LENGTH_CHARACTERS', { lng: lng, count: 253 }),
                        pattern: /^(?![^/]{254,}\/)/
                    }
                ],
                qualifiedName: [
                    {
                        name: 'validCharacters',
                        label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _, .',
                        pattern: /^[\w.-]+$/
                    },
                    {
                        name: 'beginEnd',
                        label: $i18next.t('common:BEGIN_END_WITH_ALPHANUMERIC', {lng: lng}),
                        pattern: /^([A-Za-z0-9].*)?[A-Za-z0-9]$/
                    },
                    {
                        name: 'maxLength',
                        label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 63}),
                        pattern: /^[\S\s]{1,63}$/
                    }
                ],
                wildcardDns1123Subdomain: [
                    {
                        name: 'validCharacters',
                        label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, 0–9, -, ., *',
                        pattern: /^[a-z0-9.*-]+$/
                    },
                    {
                        name: 'begin',
                        label: $i18next.t('common:BEGIN_WITH', {lng: lng, characters: '"*."'}),
                        pattern: /^\*\..*$/
                    },
                    {
                        name: 'asteriskOnlyAtStart',
                        label: $i18next.t('common:ASTERISK_ONLY_AT_START', {lng: lng}),
                        pattern: /^.(?!.*\*)/
                    },
                    {
                        name: 'end',
                        label: $i18next.t('common:END_WITH', {lng: lng, characters: 'lowercase alphanumeric characters'}) + ' (a–z, 0–9)',
                        pattern: /^.*[a-z0-9]$/
                    },
                    {
                        name: 'noConsecutivePeriodsOrPeriodHyphenMixes',
                        label: $i18next.t('common:NO_CONSECUTIVE_CHARACTER', {lng: lng, characters: 'periods or period/hyphen mixes'}) + ' (.., .-, -.)',
                        pattern: /^(?!.*\.\.)(?!.*\.-)(?!.*-\.)/
                    },
                    {
                        name: 'maxLength',
                        label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 253}),
                        pattern: /^(?=[\S\s]{1,253}$)/
                    }
                ]
            }
        };

        var functionNameRules = lodash.filter(validationRules.k8s.dns1035Label, function (rule) {
            return rule.name !== 'maxLength';
        });

        functionNameRules.push({
            name: 'maxLength',
            label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 56}),
            pattern: /^(?=[\S\s]{1,56}$)/
        });

        lodash.set(validationRules, 'function.name', functionNameRules);

        return {
            boolean: /^(0|1)$/,
            browseAttributeName: /^[A-Za-z_][A-Za-z0-9_]*$/,
            container: /^(?!.*--)(?!.*__)(?=.*[a-z])[a-z0-9][a-z0-9-_]*[a-z0-9]$|^[a-z]$/,
            digits: /^\+?(0|[1-9]\d*)$|^$/,
            dockerReference: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]))*(:\d+)?\/)?[a-z0-9]+(([._]|__|[-]*)[a-z0-9]+)*(\/[a-z0-9]+(([._]|__|[-]*)[a-z0-9]+)*)*(:[\w][\w.-]{0,127})?(@[A-Za-z][A-Za-z0-9]*([-_+.][A-Za-z][A-Za-z0-9]*)*:[0-9a-fA-F]{32,})?$/,
            email: /^[^@]+@[^@]+\.[^@]+$/,
            float: /^\d{1,9}(\.\d{1,2})?$/,
            floatingPoint: /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/,
            fullName: /^[a-zA-Z][a-zA-Z- ]*$/,
            functionName: /^(?=[\S\s]{1,63}$)[a-z]([-a-z0-9]*[a-z0-9])?$/,
            geohash: /^[a-z0-9]*$/,
            hostName_IpAddress: /(^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$)|(^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9])$)/,
            id: /^[a-zA-Z0-9-]*$/,
            ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            k8s: {
                envVarName: /^(?!\.$)(?!\.\.[\S\s]*$)[-._a-zA-Z][-._a-zA-Z0-9]*$/,
                jupyterEnvVarName: /^(?!\.[\S\s]*$)[-._a-zA-Z][-._a-zA-Z0-9]*$/
            },
            mask: /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/,
            name: /^[a-zA-Z0-9_]*$/,
            negativeFloat: /^[-]?\d{1,9}(\.\d{1,2})?$/,
            negativeInteger: /^[-]?(0|[1-9]\d*)$|^$/,
            networkName: /^[a-zA-Z0-9.\-()\\/:\s]*$/,
            noSpacesNoSpecChars: /^[A-Za-z0-9_-]*$/,
            password: /^.{6,128}$/,
            path: /^(\/[\w-]+)+(.[a-zA-Z]+?)$/,
            percent: /^([1-9]|[1-9][0-9]|100)$/,
            phone: /^\+?\d[\d-]{4,17}$/,
            protocolIpPortAddress: /^[a-z]{2,6}:\/\/(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))(:\d{1,5})?$/,
            storage: /^[a-zA-Z0-9]+?:\/\/[a-zA-Z0-9_.-]+?:[a-zA-Z0-9_./-]+?@[a-zA-Z0-9_.-]+?$/,
            tenantName: /^(?=.{1,31}$)[a-zA-Z]([a-zA-Z0-9_]*[a-zA-Z0-9])?$/,
            timestamp: /^(?:\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\d|3[0-1])T(?:[0-1]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?((?:[+-](?:[0-1]\d|2[0-3]):[0-5]\d)|Z)?$/,
            url: /^[a-zA-Z0-9]+?:\/\/[a-zA-Z0-9_.-]+?:[a-zA-Z0-9_\-.]+?@[a-zA-Z0-9_.-]+?$/,
            username: /^(?=.{1,32}$)[a-zA-Z][-_a-zA-Z0-9]*$/,
            usernameAndTenantName: /^(?=.{1,32}(@|$))[a-zA-Z][-_a-zA-Z0-9]*(@(?=.{1,31}$)[a-zA-Z]([a-zA-Z0-9_]*[a-zA-Z0-9])?)?$/,

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
    }
}());
