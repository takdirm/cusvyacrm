import { config } from '@/theme/_config';
export const generateFontColors = (configuration) => {
    // eslint-disable-next-line unicorn/no-array-reduce
    return Object.entries(configuration.fonts.colors).reduce((accumulator, [key, value]) => {
        return Object.assign(accumulator, {
            [key]: {
                color: value,
            },
        });
    }, {});
};
export const generateFontSizes = () => {
    // eslint-disable-next-line unicorn/no-array-reduce
    return config.fonts.sizes.reduce((accumulator, size) => {
        return Object.assign(accumulator, {
            [`size_${size}`]: {
                fontSize: size,
            },
        });
    }, {});
};
export const staticFontStyles = {
    alignCenter: {
        textAlign: 'center',
    },
    bold: {
        fontWeight: 'bold',
    },
    capitalize: {
        textTransform: 'capitalize',
    },
    uppercase: {
        textTransform: 'uppercase',
    },
};
