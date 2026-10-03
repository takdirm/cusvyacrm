import Styled from 'styled-components';

const ProjectHeader = Styled.div`
    .ant-page-header-heading-sub-title{
        ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 0;
        position: relative;
        ${({ theme }) => (!theme.rtl ? 'padding-left' : 'padding-right')}: 15px;
        font-weight: 500;
        &:before{
            position: absolute;
            content: '';
            width: 1px;
            height: 24px;
            background: ${({ theme }) => theme['dash-color']};
            ${({ theme }) => (!theme.rtl ? 'left' : 'right')}: 0;
            top:0;
        }
    }
`;

const ProjectSorting = Styled.div`
    margin-bottom: 25px;
    .project-sort-bar{
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        background: #fff;
        padding: 12px 25px;
        border-radius: 10px;
        margin: 0;
        
        .project-sort-nav,
        .project-sort-search,
        .project-sort-group{
            padding: 0;
        }

        .project-sort-nav{
            flex-shrink: 0;
        }
        
        .project-sort-search{
            flex: 1;
            max-width: 350px;
            ${({ theme }) => (theme.rtl ? 'margin-right' : 'margin-left')}: 20px;
            .ant-select-selection-search{
                width: 100% !important;
            }
        }
        
        .project-sort-group{
            flex-shrink: 0;
            ${({ theme }) => (theme.rtl ? 'margin-right' : 'margin-left')}: 20px;
        }
    }
    @media (max-width: 1500px){
        .project-sort-search{
            .ant-select{
                width: 237px !important;
            }
        }
        .project-sort-group .sort-group{
            .ant-select{
                min-width: 180px;
            }
        }
    }
    @media (min-width: 1201px) and (max-width: 1300px) {
        .project-sort-search{
            .ant-select{
                width: 170px !important;
            }
        }
        .project-sort-group{
            padding: 0 5px;
            
        }
        .project-sort-group .sort-group .layout-style a{
            width: 35px;
            height: 35px;
        }
        .project-sort-group .sort-group .ant-select {
            min-width: 170px;
            ${({ theme }) => (!theme.rtl ? 'padding-left' : 'padding-right')}: 5px;
            ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 5px;
        }
    }
    @media (max-width: 1199px){
        .project-sort-search{
            flex: 0 0 100%;
            order: 0;
            margin-bottom: 25px;
            display: flex;
            justify-content: center;
            .ant-select{
                width: 350px !important;
            }
        }
        .project-sort-nav{
            order: 1;
            margin: 0 auto;
        }
        .project-sort-group{
            order: 2;
        }
    }
    @media (max-width: 991px){
        .project-sort-group{
            ${({ theme }) => (theme.rtl ? 'margin-right' : 'margin-left')}: unset;
            flex: 0 0 100%;
            margin-top: 15px;
            .sort-group{
                justify-content: flex-start;
                .layout-style{
                    ${({ theme }) => (theme.rtl ? 'margin-right' : 'margin-left')}: auto;
                }
            }
        }
    }
    @media (max-width: 575px){
        .project-sort-group{
            .sort-group{
                > span{
                    display: none;
                }
                .ant-select{
                    ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 0;
                }
            }
        }
    }

    nav{
        ul{
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            li{
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 25px;
                ${({ theme }) => (theme.rtl ? 'padding-left' : 'padding-right')}: 25px;
                ${({ theme }) => (theme.rtl ? 'border-left' : 'border-right')}: 1px solid ${({ theme }) =>
  theme['border-color-light']};
                &:last-child{
                    ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 0;
                    ${({ theme }) => (theme.rtl ? 'padding-left' : 'padding-right')}: 0;
                    ${({ theme }) => (theme.rtl ? 'border-left' : 'border-right')}: 0 none;
                }
                a{
                    color: ${({ theme }) => theme['gray-solid']};
                    font-weight: 500;
                    font-size: 14px;
                }
                &.active{
                    a{
                        color: ${({ theme }) => theme['primary-color']};
                    }
                }
            }
        }
    }
    .project-sort-search{
        .ant-select-auto-complete{
            .ant-select-selector{
                // border: 1px solid ${({ theme }) => theme['border-color-light']};
                border: 0 none;
                border-radius: 20px;
                height: 40px;
                padding: 0 15px;
                .ant-select-selection-search{
                    input{
                        height: 38px;
                    }
                }
            }
            &:hover,
            &.ant-select-focused{
                .ant-select-selector{
                    border-color: ${({ theme }) => theme['primary-color']};
                }
            }
        }
    }
    .ant-select-selection-search-input{
        border: 0 none;
        border-radius: 23px;
        input{
            height: 40px !important;
            border-radius: 23px;
        }
    }
    .ant-select-arrow{
        right: auto;
        ${({ theme }) => (theme.rtl ? 'left' : 'right')}: 11px !important;
    }
    
    .sort-group{
        color: ${({ theme }) => theme['gray-solid']};
        display: flex;
        align-items: center;
        justify-content: flex-end;

               
        .ant-select{
            ${({ theme }) => (!theme.rtl ? 'padding-left' : 'padding-right')}: 10px;
            ${({ theme }) => (!theme.rtl ? 'margin-left' : 'margin-right')}: 15px;
            min-width: 260px;
            display: flex;
            align-items: center;
            justify-content: center;
            .ant-select-selector{
                border: 0 none;
                .ant-select-selection-item{                    
                    color: ${({ theme }) => theme['gray-solid']};
                }
                
            }
        }
        .layout-style{
            display: flex;
            align-items: center;
            ${({ theme }) => (theme.rtl ? 'margin-right' : 'margin-left')}: 20px;
            a{
                display: flex;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                align-items: center;
                justify-content: center;
                color: ${({ theme }) => theme['gray-solid']};
                &:hover,
                &.active{
                    color: ${({ theme }) => theme['primary-color']};
                    background: #fff;
                }
            }
        }
    }
    @media (max-width: 400px){
        .sort-group .ant-select{
            min-width: 200px;
        }
        .project-sort-search{
            .ant-select-auto-complete{
                width: 100% !important;
            }
        }
        .project-sort-nav{
            nav{
                padding: 10px;
            }
            nav ul{
                flex-wrap: wrap;
                justify-content: center;
                margin-bottom: -5px;
                li{
                    ${({ theme }) => (theme.rtl ? 'border-left' : 'border-right')}: 0 none;
                    margin-bottom: 5px;
                }
            }
        }
    }
`;

const ProjectCard = Styled.div`
    .ant-card-body{
        padding: 0px !important;
    }
    .project-top{
        padding:30px 30px 0px;
    }
    .project-bottom{
        .project-assignees{
            padding: 16px 30px 25px;
        }
    }
    .project-title{
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        h1{
            font-size: 16px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            margin: -2px;
            a{
                color: ${({ theme }) => theme['dark-color']};
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 11px !important;
            }
            a,
            .ant-tag{
                margin: 2px;
            }
            .ant-tag{
                text-transform: uppercase;
                font-size: 10px;
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 0;
                line-height: 18px;
                background: red;
                color: #fff;
                border: 0 none;
                border-radius: 4px;
                padding: 2px 8px;
                &.early{
                    background: ${({ theme }) => theme['primary-color']};
                }
                &.progress{
                    background: ${({ theme }) => theme['danger-color']};
                }
                &.late{
                    background: ${({ theme }) => theme['warning-color']};
                }
                &.complete{
                    background: ${({ theme }) => theme['success-color']};
                }
            }
        }
        .ant-dropdown-trigger{
            color: ${({ theme }) => theme['extra-light-color']};
        }
    }
    .project-desc{
        margin: 7px 0 25px 0;
        color: ${({ theme }) => theme['gray-color']};
    }
    .project-timing{
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        div{
            ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 30px;
            &:last-child{
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 0;
            }
            span, strong{
                display: block;
            }
            span{
                font-size: 12px;
                margin-bottom: 2px;
                color: ${({ theme }) => theme['gray-solid']};
            }
            strong{
                font-weight: 500;
            }
        }
    }
    .project-progress{
        margin-bottom: 17px;
        position: relative;
        padding-${({ theme }) => (theme.rtl ? 'left' : 'right')}: 45px;
        p{
            margin: 8px 0 0 0;
            color: ${({ theme }) => theme['gray-solid']};
            font-size: 12px;
        }
        .ant-progress{
            .ant-progress-outer{
                .ant-progress-inner{
                    background-color: ${({ theme }) => theme['border-color-light']};
                    border-radius: 10px;
                    .ant-progress-bg{
                        border-radius: 10px;
                        height: 5px !important;
                    }
                }
            }
            .ant-progress-text{
                position: absolute;
                ${({ theme }) => (theme.rtl ? 'left' : 'right')}: -35px;
                top: -5px;
                font-size: 12px;
                font-weight: 500;
                color: ${({ theme }) => theme['gray-color']};
                min-width: 40px;
                text-align: ${({ theme }) => (theme.rtl ? 'left' : 'right')};
                margin: 0;
                line-height: 1;
            }
        }
        .progress-primary{
            .ant-progress-bg{
                background-color: ${({ theme }) => theme['primary-color']};
            }
        }
    }
    .project-assignees{
        border-top: 1px solid ${({ theme }) => theme['border-color-light']};
        margin-top: 17px;
        padding-top: 16px;
        p{
            font-size: 13px;
            color: ${({ theme }) => theme['gray-solid']}
        }
        ul{
            margin: -3px;
            padding: 0;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            li{
                list-style: none;
                padding: 3px;
                img{
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    object-fit: cover;
                }
            }
        }
    }
`;

const ProjectPagination = Styled.div`
    margin-top: 10px;
    .ant-pagination{
        display: flex;
        justify-content: flex-end;
        @media only screen and (max-width: 767px) {
            justify-content: center;
        }
        .ant-pagination-prev,
        .ant-pagination-next,
        .ant-pagination-jump-prev,
        .ant-pagination-jump-next,
        .ant-pagination-item{
            min-width: 36px;
            height: 36px;
            line-height: 34px;
            border-radius: 6px;
            border: 1px solid ${({ theme }) => theme['border-color-light']};
            background-color: #fff;
            ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 8px;
        }
        
        .ant-pagination-item{
            margin: 0;
            a{
                display: block;
                color: ${({ theme }) => theme['gray-color']};
            }
            &:hover{
                border-color: ${({ theme }) => theme['primary-color']};
                a{
                    color: ${({ theme }) => theme['primary-color']};
                }
            }
        }
        
        .ant-pagination-item-active{
            background-color: ${({ theme }) => theme['primary-color']};
            border-color: ${({ theme }) => theme['primary-color']};
            a{
                color: #fff;
            }
            &:hover{
                background-color: ${({ theme }) => theme['primary-color']};
                border-color: ${({ theme }) => theme['primary-color']};
                a{
                    color: #fff;
                }
            }
        }
        
        .ant-pagination-prev,
        .ant-pagination-next{
            margin: 0;
            &:hover:not(.ant-pagination-disabled){
                border-color: ${({ theme }) => theme['primary-color']};
                .ant-pagination-item-link{
                    color: ${({ theme }) => theme['primary-color']};
                }
            }
        }
        
        .ant-pagination-disabled{
            .ant-pagination-item-link{
                color: ${({ theme }) => theme['light-gray']};
                cursor: not-allowed;
            }
        }
        
        .ant-pagination-options{
            ${({ theme }) => (theme.rtl ? 'margin-right' : 'margin-left')}: 16px;
            .ant-select{
                .ant-select-selector{
                    border-radius: 6px;
                    min-width: 100px;
                    height: 36px !important;
                    border: 1px solid ${({ theme }) => theme['border-color-light']};
                    padding: 0 11px !important;
                    .ant-select-selection-item{
                        line-height: 34px !important;
                        padding: 0 !important;
                        font-size: 14px;
                        color: ${({ theme }) => theme['gray-color']};
                    }
                }
                .ant-select-arrow{
                    color: ${({ theme }) => theme['gray-color']};
                    ${({ theme }) => (theme.rtl ? 'left' : 'right')}: 11px;
                    top: 50%;
                    transform: translateY(-50%);
                    margin-top: -1px;
                }
                &:hover,
                &.ant-select-focused{
                    .ant-select-selector{
                        border-color: ${({ theme }) => theme['primary-color']};
                    }
                }
            }
        }
    }
`;

const ProjectListTitle = Styled.div`
    h1{
        font-size: 15px;
        font-weight: 500;
        margin-bottom: 5px;
        a{
            color: ${({ theme }) => theme['dark-color']};
        }
    }
    p{
        margin: 0;
        font-size: 12px;
        color: ${({ theme }) => theme['gray-solid']};
    }
`;

const ProjectListAssignees = Styled.div`
    ul{
        margin: -3px;
        padding: 0;
        display: flex;
        align-items: center;
        li{
            list-style: none;
            padding: 3px;
            img{
                width: 35px;
                height: 35px;
                border-radius: 50%;
                object-fit: cover;
            }
        }
    }
`;

const ProjectList = Styled.div`

    .project-list-progress{
        position: relative;
        padding-${({ theme }) => (theme.rtl ? 'left' : 'right')}: 45px;
        p{
            margin: 8px 0 0 0;
            font-size: 12px;
            color: ${({ theme }) => theme['gray-solid']};
        }
        .ant-progress{
            .ant-progress-outer{
                .ant-progress-inner{
                    background-color: ${({ theme }) => theme['border-color-light']};
                    border-radius: 10px;
                    .ant-progress-bg{
                        border-radius: 10px;
                        height: 5px !important;
                    }
                }
            }
            .ant-progress-text{
                position: absolute;
                ${({ theme }) => (theme.rtl ? 'left' : 'right')}: -35px;
                top: -5px;
                font-size: 12px;
                font-weight: 500;
                color: ${({ theme }) => theme['gray-color']};
                min-width: 40px;
                text-align: ${({ theme }) => (theme.rtl ? 'left' : 'right')};
                margin: 0;
                line-height: 1;
            }
        }
        .progress-primary{
            .ant-progress-bg{
                background-color: ${({ theme }) => theme['primary-color']};
            }
        }
    }
    .date-started,
    .date-finished{
        font-weight: 500;
    }
    .ant-table{
        .ant-table-thead{
            th{
                background-color: ${({ theme }) => theme['bg-color-light']};
            }
        }
        .ant-table-tbody{
            tr{
                &:hover{
                    td{
                        background-color: ${({ theme }) => theme['bg-color-light']};
                    }
                }
            }
        }
    }
    .ant-table-container table > thead > tr th{
        font-weight: 400;
        color: ${({ theme }) => theme['light-color']};
        border-top: 1px solid ${({ theme }) => theme['border-color-light']};
    }
    .ant-table-container table > thead > tr th:first-child{
        border-radius: ${({ theme }) => (theme.rtl ? '0 10px 10px 0' : '10px 0 0 10px')} !important;
        ${({ theme }) => (!theme.rtl ? 'border-left' : 'border-right')}: 1px solid ${({ theme }) =>
  theme['border-color-light']};
    }
    .ant-table-container table > thead > tr th:last-child{
        border-radius: ${({ theme }) => (!theme.rtl ? '0 10px 10px 0' : '10px 0 0 10px')} !important;
        ${({ theme }) => (theme.rtl ? 'border-left' : 'border-right')}: 1px solid ${({ theme }) =>
  theme['border-color-light']};
    }
    .ant-dropdown-trigger{
        svg{
            color: ${({ theme }) => theme['extra-light-color']};
        }
    }
`;

const ProjectDetailsWrapper = Styled.div`
    .project-header{
        display: flex;
        align-items: center;
        @media only screen and (max-width: 800px) {
            flex-wrap: wrap;
        }
        @media only screen and (max-width: 575px) {
            flex-flow: column;
            button{
                margin: 15px 0 0;
            }
        }
        h1{
            ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 20px;
            margin-bottom: 0;
            font-size: 20px;
            @media only screen and (max-width: 800px) {
                margin-bottom: 10px;
            }
            @media only screen and (max-width: 575px) {
                margin: 0;
            }
        }
        button{
            font-size: 12px;
            font-weight: 500;
            ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 10px;
            height: 35px;
            padding: 0px 13.5px;
            &.btn-markComplete{
                background: #fff;
                border-color: ${({ theme }) => theme['border-color-deep']};
            }
        }
    }
    .project-action{
        .project-edit,
        .project-remove{
            border-radius: 6px;
            background: #fff;
            height: 35px;
            padding: 0 15px;
            font-size: 12px;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 0 5px;
            box-shadow: 0 3px 5px ${({ theme }) => theme['gray-solid']}05;
            svg,
            img{
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 6px;
            }
        }
        .project-edit{
            color: ${({ theme }) => theme['primary-color']};
        }
        .project-remove{
            color: ${({ theme }) => theme['danger-color']};
        }
    }
    .project-progress{
        border-radius: 10px;
        background: ${({ theme }) => theme['success-color']};
        padding: 20px 25px 20px;
        margin-bottom: 25px;
        position: relative;
        padding-${({ theme }) => (theme.rtl ? 'left' : 'right')}: 65px;
        h3{
            color: #fff;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 12px;
        }
        .ant-progress{
            .ant-progress-outer{
                .ant-progress-inner{
                    background: rgba(255,255,255, 0.2);
                    border-radius: 10px;
                    .ant-progress-bg{
                        background: #fff;
                        border-radius: 10px;
                        height: 5px !important;
                    }
                }
            }
            .ant-progress-text{
                position: absolute;
                ${({ theme }) => (theme.rtl ? 'left' : 'right')}: -45px;
                top: 50%;
                transform: translateY(-50%);
                color: #fff;
                font-weight: 500;
                font-size: 18px;
                margin: 0;
                line-height: 1;
            }
        }
    }
    .about-project-wrapper{
        min-height: 485px;
        background: #fff;
        border-radius: 10px;
        margin-bottom: 25px;
    }
    .state-single{
        display: flex;
        align-items: center;
        margin-bottom: 25px;
        &:last-child{
            margin-bottom: 0;
        }
        > div{
            ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 20px;
        }
        a{
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            border-radius: 12px;
            background: rgba(95,99,242,0.1);
        }
        h1{
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 3px;
        }
        p{
            color: ${({ theme }) => theme['gray-solid']};
            margin: 0;
        }
        .color-primary{
            a{
                background: rgba(95,99,242,0.1);
                svg{
                    color: ${({ theme }) => theme['primary-color']};
                }
            }
        }
        .color-secondary{
            a{
                background: rgba(255,105,165,0.1);
                svg{
                    color: ${({ theme }) => theme['secondary-color']};
                }
            }
        }
        .color-success{
            a{
                background: rgba(32,201,151,0.1);
                svg{
                    color: ${({ theme }) => theme['success-color']};
                }
            }
        }
        .color-warning{
            a{
                background: rgba(250,139,12,0.1);
                svg{
                    color: ${({ theme }) => theme['warning-color']};
                }
            }
        }
    }
    .about-content{
        p{
            font-size: 15px;
            line-height: 25px;
            color: ${({ theme }) => theme['gray-color']};
        }
    }
    .about-project{
        margin: 42px -40px 0;
        display: flex;
        align-items: center;
        @media only screen and (max-width: 991px) {
            flex-flow: column;
            align-items: flex-start;
        }
        div{
            margin: 0 40px;
            span{
                color: ${({ theme }) => theme['gray-solid']};
                font-size: 13px;
                display: block;
                margin-bottom: 3px;
            }
            p{
                font-weight: 500;
            }
        }
    }
    .project-users-wrapper{
        .btn-addUser{
            padding: 0px 12.6px;
            font-size: 12px;
            font-weight: 500;
            border-color: ${({ theme }) => theme['border-color-light']};
        }
        i +span, svg +span, img +span {
            ${({ theme }) => (theme.rtl ? 'margin-right' : 'margin-left')}: 6px;
        }
    }
    .project-users{
        min-height: 368px;
        .porject-user-single{
            display: flex;
            align-items: center;
            margin-bottom: 25px;
            &:last-child{
                margin-bottom: 0;
            }
            & > div{
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 15px;
            }
            div{
                img{
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    object-fit: cover;
                    display: block;
                }
                h1{
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                p{
                    color: ${({ theme }) => theme['gray-solid']};
                    margin: 0;
                }
            }
        }
    }

    .file-list{
        min-height: 385px;
        .file-list__single{
            justify-content: space-between;
            align-items: center;
            &:not(:last-child){
                margin-bottom: 18px;
            }
            span{
                display: block;
                font-size: 12px;
                line-height: 1.42;
                &.file-name{
                    font-size: 14px;
                    font-weight: 500;
                    color: ${({ theme }) => theme['dark-color']};
                }
                &.file-size{
                    margin: 2px 0;;
                    color: ${({ theme }) => theme['gray-solid']};
                }
                &.file-content-action{
                    a{
                        font-weight: 500;
                        color: ${({ theme }) => theme['primary-color']};
                    }
                    a + a{
                        margin-left: 8px;
                    }
                }
            }
        }
        .file-single-info{
            width: 50%;
            align-items: center;
            .file-single-logo{
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 16px;
                img{
                    max-width: 42px;
                }
            }
        }
        .file-single-action{
            .ant-dropdown-trigger {
                color: ${({ theme }) => theme['extra-light-color']};
            }
        }
    }

    .dropdown-more{
        a{
            font-size: 13px;
            svg,
            i.
            img{
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 8px;
            }
        }
    }
`;

const TaskLists = Styled.div`
    .ant-card{
        .ant-card-head{
            border-color: ${({ theme }) => theme['border-color-light']};
            margin-bottom: 0;
        }
        .ant-card-body{
            padding: 0 !important;
        }
    }
    nav{
        a{
            font-size: 14px;
            font-weight: 500;
            color: ${({ theme }) => theme['gray-solid']};
            position: relative;
            padding: 20px 0px;
            &:not(:last-child){
                ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 18px;
            }
            &:before{
                position: absolute;
                content: '';
                width: 100%;
                ${({ theme }) => (theme.rtl ? 'right' : 'left')}: 0;
                bottom: -2px;
                height: 1px;

            }
            &.active{
                color: ${({ theme }) => theme['primary-color']};
                &:before{
                    background: ${({ theme }) => theme['primary-color']};
                }
            }
        }
    }
    table{
        margin-top: 15px;
        .ant-checkbox{
            .ant-checkbox-inner{
                width: 16px !important;
                height: 16px !important;
                border-radius: 3px;
            }
        }
        .ant-checkbox-checked{
            .ant-checkbox-inner{
                background: ${({ theme }) => theme['success-color']};
                border-color: ${({ theme }) => theme['success-color']};
                &:after{
                    border-color: #fff;
                    border-width: 1.5px;
                    width: 5px;
                    height: 9px;
                    transform: rotate(45deg) scale(1) translate(-50%, -50%);
                    left: 22%;
                    top: 44%;
                }
            }
            &:after{
                border-color: ${({ theme }) => theme['success-color']};
            }
        }
        .ant-checkbox-indeterminate {
            .ant-checkbox-inner{
                background: ${({ theme }) => theme['success-color']};
                border-color: ${({ theme }) => theme['success-color']};
                &:after{
                    background: #fff;
                    height: 1.5px;
                    width: 8px;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
            }
        }
        thead{
            display: none;
        }
        tr{
            th{
                background: #fff;
                border-bottom: 0;
                padding: 10px;
                &:first-child{
                    ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 25px;
                }
            }
            &:hover{
                td{
                    background: #fff;
                }
            }
        }
        .ant-table-tbody{
            > tr.ant-table-row{
                &.ant-table-row-selected{
                    > td{
                        background: #fff;
                    }
                    .task-title{
                        text-decoration: line-through;
                    }
                }
                > td{
                    padding: 10px;
                    border-bottom: 0;
                    text-align: ${({ theme }) => (theme.rtl ? 'right' : 'left')};
                    &:first-child{
                        ${({ theme }) => (!theme.rtl ? 'padding-left' : 'padding-right')}: 25px;
                    }
                    &:last-child{
                        ${({ theme }) => (theme.rtl ? 'padding-left' : 'padding-right')}: 25px;
                    }
                    .task-title{
                        color: ${({ theme }) => theme['gray-color']};
                    }
                    .task-created{
                        font-size: 12px;
                        color: ${({ theme }) => theme['gray-color']};
                    }
                    .ant-checkbox{
                        &:hover{
                            .ant-checkbox-inner{
                                border-color: ${({ theme }) => theme['success-color']};
                            }
                        }
                    }
                }
                &:hover{
                    box-shadow: 0 15px 50px ${({ theme }) => theme['gray-solid']}20;
                    > td{
                        background: #fff;
                    }
                }
            }
        }
    }

    .tasklist-action{
        margin: 18px 25px 25px;
        button{
            width: 100%;
            text-align: ${({ theme }) => (theme.rtl ? 'right' : 'left')};
            justify-content: flex-start;
            font-size: 12px;
            font-weight: 500;
            &.ant-btn-primary{
                border-radius: 6px;
                background: ${({ theme }) => theme['primary-color']}10;
            }
        }
    }
`;

const TasklistAction = Styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 0 -10px;
    span, img, div{
        display: block;
        margin: 0 10px;
        line-height: normal;
    }
    span, a{
        color: ${({ theme }) => theme['gray-solid']};
    }
    .task-created{
        color: #9299b8 !important;
    }
    .task-move{
        svg,
        i{
            color: #D8DCEB;
        }
    }
`;

const ActivitiesWrapper = Styled.div`
    padding: 25px;
    min-height: 435px;
    .activity-block{
        &:not(:last-child){
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid ${({ theme }) => theme['border-color-light']};
        }
    }
    .activity-dateMeta{
        height: 100%;
        border-radius: 10px;
        display: flex;
        flex-flow: column;
        align-items: center;
        justify-content: center;
        background: ${({ theme }) => theme['bg-color-light']};
        border: 1px solid ${({ theme }) => theme['border-color-light']};
        @media only screen and (max-width: 575px) {
            height: auto;
            padding: 30px 0px;
            margin-bottom: 25px;
        }
        h1{
            font-size: 18px;
            margin-bottom: 0px;
        }
        .activity-month{
            color: ${({ theme }) => theme['gray-color']};
        }
    }

    .activity-single{
        &:not(:last-child){
            margin-bottom: 25px;
        }
        .activity-icon{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 24px;
            width: 24px;
            border-radius: 50%;
            margin: ${({ theme }) => (theme.rtl ? '4px 0 0 10px' : '4px 10px 0 0')};
            &.bg-primary{
                background: ${({ theme }) => theme['primary-color']}15;
                color: ${({ theme }) => theme['primary-color']};
            }
            &.bg-secondary{
                background: ${({ theme }) => theme['secondary-color']}15;
                color: ${({ theme }) => theme['secondary-color']};
            }
            &.bg-success{
                background: ${({ theme }) => theme['success-color']}15;
                color: ${({ theme }) => theme['success-color']};
            }
        }
        img{
            ${({ theme }) => (theme.rtl ? 'margin-left' : 'margin-right')}: 12px;
        }
        .activity-title{
            font-size: 14px;
            font-weight: 500;
            margin: -4px 0 0;
            span{
                font-weight: 400;
                margin: 0 2px;
                color: ${({ theme }) => theme['gray-solid']};
            }
        }
        .activity-timeMeta{
            font-size: 12px;
            margin-bottom: 0;
            color: ${({ theme }) => theme['extra-light-color']};
        }
    }
`;

export {
  ProjectHeader,
  ProjectSorting,
  ProjectCard,
  ProjectPagination,
  ProjectListTitle,
  ProjectListAssignees,
  ProjectList,
  ProjectDetailsWrapper,
  TaskLists,
  TasklistAction,
  ActivitiesWrapper,
};
