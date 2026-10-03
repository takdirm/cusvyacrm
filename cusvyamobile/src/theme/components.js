const generateComponentStyles = ({ backgrounds, fonts, layout, }) => {
    return {
        buttonCircle: {
            ...layout.justifyCenter,
            ...layout.itemsCenter,
            ...backgrounds.purple100,
            ...fonts.gray400,
            borderRadius: 35,
            height: 64,
            width: 64,
        },
        circle250: {
            borderRadius: 140,
            height: 250,
            width: 250,
        },
    };
};
export default generateComponentStyles;
