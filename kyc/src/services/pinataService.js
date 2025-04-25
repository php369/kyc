import axios from 'axios';

const PINATA_API_KEY = 'c748492d58a67195be7b'
const PINATA_SECRET_KEY ='af6f184ad0f0f63aab34a5955a1c217d67bbbb4f019a0cd25ae7a6ad2f9482ee'
const PINATA_GATEWAY = 'scarlet-general-rook-434.mypinata.cloud/ipfs/'

const uploadToIPFS = async (file) => {
    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload to Pinata
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'pinata_api_key':'c748492d58a67195be7b',
                    'pinata_secret_api_key': 'af6f184ad0f0f63aab34a5955a1c217d67bbbb4f019a0cd25ae7a6ad2f9482ee',
                },
            }
        );

        // Return the IPFS hash
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw new Error('Failed to upload file to IPFS');
    }
};

const getIPFSURL = (hash) => {
    return `${PINATA_GATEWAY}${hash}`;
};

export { uploadToIPFS, getIPFSURL }; 