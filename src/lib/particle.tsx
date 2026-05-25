'use client';
// src/lib/particle.tsx
// Particle Network ConnectKit 客户端配置

import React from 'react';
import { ConnectKitProvider, createConfig } from '@particle-network/connectkit';
import { authWalletConnectors } from '@particle-network/connectkit/auth';
import { mainnet } from 'viem/chains';
import { wallet, EntryPosition } from '@particle-network/connectkit/wallet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID as string;
const clientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY as string;
const appId = process.env.NEXT_PUBLIC_PARTICLE_APP_ID as string;

const config = createConfig({
    projectId,
    clientKey,
    appId,
    appearance: {
        mode: 'dark',
        connectorsOrder: ['social'],
    },
    walletConnectors: [
        authWalletConnectors({
            authTypes: ['github', 'email'], // GitHub + Email OTP 统一入口
            promptSettingConfig: {
                promptMasterPasswordSettingWhenLogin: 0,
                promptPaymentPasswordSettingWhenSign: 0,
            },
        }),
    ],
    plugins: [
        wallet({
            entryPosition: EntryPosition.BR,
            visible: false, // 隐藏 Particle 默认钱包挂件，全权由 UniSkill Widget 控制
        }),
    ],
    chains: [mainnet],
});

interface ParticleAuthProviderProps {
    children: React.ReactNode;
}

const queryClient = new QueryClient();

export function ParticleAuthProvider({ children }: ParticleAuthProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <ConnectKitProvider config={config}>
                {children}
            </ConnectKitProvider>
        </QueryClientProvider>
    );
}

