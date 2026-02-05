'use client';

import React, { useState } from 'react';
import { Overlay, ModalContainer, Message, Input, ErrorMessage, ButtonContainer, Button } from './styles';

interface BirthdayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (birthday: string) => boolean;
}

export const BirthdayModal = ({ isOpen, onClose, onConfirm }: BirthdayModalProps) => {
    const [birthday, setBirthday] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        const isValid = onConfirm(birthday);
        if (!isValid) {
            setError('올바른 생년월일을 입력해 주세요.');
        } else {
            setError('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <Message>생년월일(6자리)을 입력하세요</Message>
                <Input
                    type="text"
                    placeholder="생년월일"
                    maxLength={6}
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <ErrorMessage>{error}</ErrorMessage>
                <ButtonContainer>
                    <Button onClick={onClose}>취소</Button>
                    <Button primary onClick={handleConfirm}>확인</Button>
                </ButtonContainer>
            </ModalContainer>
        </Overlay>
    );
};
