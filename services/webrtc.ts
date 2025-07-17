import { PeerConnectionStatus, type SyncMessage } from '../types';

// Using public STUN servers
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

type WebRTCServiceCallbacks = {
    onStatusChange: (peerId: string, status: PeerConnectionStatus) => void;
    onDataChannel: (peerId: string, channel: RTCDataChannel) => void;
    onIceCandidate: (peerId: string, candidate: RTCIceCandidate) => void;
};

const connections: Map<string, RTCPeerConnection> = new Map();
const dataChannels: Map<string, RTCDataChannel> = new Map();


const _createPeerConnection = (peerId: string, callbacks: WebRTCServiceCallbacks): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            callbacks.onIceCandidate(peerId, event.candidate);
        }
    };

    pc.onconnectionstatechange = () => {
        const statusMap: Record<string, PeerConnectionStatus> = {
            new: PeerConnectionStatus.Connecting,
            connecting: PeerConnectionStatus.Connecting,
            connected: PeerConnectionStatus.Connected,
            disconnected: PeerConnectionStatus.Disconnected,
            closed: PeerConnectionStatus.Disconnected,
            failed: PeerConnectionStatus.Failed,
        };
        const newStatus = statusMap[pc.connectionState] || PeerConnectionStatus.Connecting;
        callbacks.onStatusChange(peerId, newStatus);
    };

    pc.ondatachannel = (event) => {
        const channel = event.channel;
        channel.binaryType = 'arraybuffer'; // Crucial for file transfer
        dataChannels.set(peerId, channel);
        callbacks.onDataChannel(peerId, event.channel);
    };
    
    connections.set(peerId, pc);
    return pc;
};


export const WebRTCManager = {
    async createOffer(peerId: string, callbacks: WebRTCServiceCallbacks): Promise<RTCSessionDescriptionInit> {
        const pc = _createPeerConnection(peerId, callbacks);
        
        return new Promise(async (resolve, reject) => {
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === 'complete') {
                    resolve(pc.localDescription!);
                }
            };

            try {
                const dataChannel = pc.createDataChannel('file-sync', { ordered: true });
                dataChannel.binaryType = 'arraybuffer'; // Crucial for file transfer
                dataChannels.set(peerId, dataChannel);
                callbacks.onDataChannel(peerId, dataChannel);

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
            } catch (error) {
                reject(error);
            }
        });
    },

    async createAnswer(peerId: string, offer: RTCSessionDescriptionInit, callbacks: WebRTCServiceCallbacks): Promise<RTCSessionDescriptionInit> {
        const pc = _createPeerConnection(peerId, callbacks);
        
        return new Promise(async (resolve, reject) => {
            pc.onicegatheringstatechange = () => {
                if (pc.iceGatheringState === 'complete') {
                    resolve(pc.localDescription!);
                }
            };
            
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
            } catch (error) {
                reject(error);
            }
        });
    },

    async setRemoteAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
        const pc = connections.get(peerId);
        if (!pc) throw new Error('Peer connection not found');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    },

    async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
        const pc = connections.get(peerId);
        if (!pc) throw new Error('Peer connection not found');
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    },

    async sendMessage(peerId: string, message: SyncMessage | ArrayBuffer): Promise<void> {
        const channel = dataChannels.get(peerId);
        if (channel && channel.readyState === 'open') {
             try {
                // Handle backpressure for binary data
                if (message instanceof ArrayBuffer) {
                    // If buffer is full, wait for it to drain
                    if (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
                         await new Promise<void>(resolve => {
                            channel.onbufferedamountlow = () => {
                                channel.onbufferedamountlow = null; // Clean up listener
                                resolve();
                            };
                        });
                    }
                    channel.send(message);
                } else {
                    channel.send(JSON.stringify(message));
                }
             } catch(e) {
                console.error(`Failed to send message to ${peerId}:`, e)
             }
        } else {
            console.warn(`Data channel for peer ${peerId} is not open or does not exist.`);
        }
    },
    
    closeConnection(peerId: string): void {
        const pc = connections.get(peerId);
        if (pc) {
            pc.close();
            connections.delete(peerId);
        }
        const channel = dataChannels.get(peerId);
        if (channel) {
            channel.close();
            dataChannels.delete(peerId);
        }
    }
};