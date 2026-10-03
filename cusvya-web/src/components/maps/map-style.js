import Styled from 'styled-components';

const GmapWraper = Styled.div`
    width: ${(props) => props.width}; 
    height: ${(props) => props.height};
    position: relative;
    overflow: hidden;
    > div {
        width: 100%;
        height: 100%;
    }
    .gm-style {
        width: 100%;
        height: 100%;
    }
    .leaflet-container {
        width: ${(props) => props.width}; 
        height: ${(props) => props.height};
    }
`;

export { GmapWraper };
