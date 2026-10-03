import Styled from 'styled-components';
import { Steps } from 'antd';

const StepsStyle = Styled(Steps)`
    &.ant-steps {
        // Modern step indicator styling
        .ant-steps-item-icon {
            width: 40px;
            height: 40px;
            line-height: 40px;
            font-size: 16px;
            font-weight: 600;
            border-width: 2px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ant-steps-item-title {
            font-size: 15px;
            font-weight: 500;
            line-height: 22px;
            transition: all 0.3s ease;
        }
        
        .ant-steps-item-description {
            font-size: 13px;
            color: ${({ theme }) => theme['gray-color']};
        }
        
        // Active step
        .ant-steps-item-active {
            .ant-steps-item-icon {
                background: ${({ theme }) => theme['primary-color']};
                border-color: ${({ theme }) => theme['primary-color']};
                box-shadow: 0 4px 12px ${({ theme }) => theme['primary-color']}40;
                transform: scale(1.1);
                
                .ant-steps-icon {
                    color: #fff;
                }
            }
            
            .ant-steps-item-title {
                color: ${({ theme }) => theme['primary-color']};
                font-weight: 600;
            }
        }
        
        // Finished step
        .ant-steps-item-finish {
            .ant-steps-item-icon {
                background: ${({ theme }) => theme['success-color']};
                border-color: ${({ theme }) => theme['success-color']};
                
                .ant-steps-icon {
                    color: #fff;
                }
            }
            
            .ant-steps-item-title {
                color: ${({ theme }) => theme['dark-color']};
            }
            
            .ant-steps-item-tail:after {
                background: ${({ theme }) => theme['success-color']};
            }
        }
        
        // Waiting step
        .ant-steps-item-wait {
            .ant-steps-item-icon {
                background: ${({ theme }) => theme['bg-color-light']};
                border-color: ${({ theme }) => theme['border-color-normal']};
                
                .ant-steps-icon {
                    color: ${({ theme }) => theme['gray-color']};
                }
            }
            
            .ant-steps-item-title {
                color: ${({ theme }) => theme['gray-color']};
            }
        }
        
        // Step connector line
        .ant-steps-item-tail {
            padding: 4px 0 0;
            
            &:after {
                height: 2px;
                background: ${({ theme }) => theme['border-color-light']};
                transition: all 0.3s ease;
            }
        }
        
        // Hover effects
        .ant-steps-item:not(.ant-steps-item-active):not(.ant-steps-item-finish) {
            .ant-steps-item-icon:hover {
                border-color: ${({ theme }) => theme['primary-color']};
                transform: scale(1.05);
            }
        }
    }
    
    .steps-action{
        margin-top: 40px;
        button{
            height: 44px;
        }
    }
`;

const ActionWrapper = Styled.div`
    width: 100%;
    .step-action-wrap{
        display: flex;
        justify-content: center;
        .step-action-inner{
            width: 580px;
            padding: 0 25px;
            @media only screen and (max-width: 575px){
                width: 100%;
                padding: 0;
            }
        }
    }
    
    // Modern step content wrapper
    .steps-content {
        padding: 30px 0;
        animation: fadeInUp 0.4s ease-in-out;
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    }
    
    .steps-action{
        margin-top: 38px;
        width: 100%;
        float: right;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        
        @media only screen and (max-width: 991px){
            margin-top: 25px;
        }
        @media only screen and (max-width: 379px){
            flex-flow: column;
        }
        
        button{
            display: flex;
            align-items: center;
            height: 44px;
            padding: 0 24px;
            font-size: 14px;
            font-weight: 500;
            border-radius: 6px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 120px;
            justify-content: center;
            
            @media only screen and (max-width: 379px){
                width: 100%;
            }
            
            &.ant-btn-light{
                border: 1px solid ${({ theme }) => theme['border-color-light']};
                background: #fff;
                
                &:hover {
                    border-color: ${({ theme }) => theme['primary-color']};
                    color: ${({ theme }) => theme['primary-color']};
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
            }
            
            &.ant-btn-primary{
                box-shadow: 0 2px 8px ${({ theme }) => theme['primary-color']}30;
                
                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px ${({ theme }) => theme['primary-color']}40;
                }
            }
            
            &.btn-next{
                svg{
                    margin-left: 8px;
                    transition: transform 0.3s ease;
                }
                
                &:hover svg {
                    transform: translateX(4px);
                }
            }
            
            &.btn-prev{
                svg{
                    margin-right: 8px;
                    transition: transform 0.3s ease;
                }
                
                &:hover svg {
                    transform: translateX(-4px);
                }
            }
            
            &:disabled {
                transform: none !important;
                box-shadow: none !important;
            }
        }
        
        button + button {
            @media only screen and (max-width: 379px){
                margin-top: 15px;
            }
        }
    }
`;

export { StepsStyle, ActionWrapper };
