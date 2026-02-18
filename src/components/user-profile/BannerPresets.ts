export interface BannerPreset
{
    id: string;
    name: string;
    gradient: string;
    gifUrl?: string;
    animated: boolean;
}

export const DEFAULT_BANNER_ID = 'nebula';

export const BANNER_PRESETS: BannerPreset[] = [
    {
        id: 'nebula',
        name: 'Nebula',
        gradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209616422-ae1407ff-146d-46b7-b716-d43da5cb021d.gif',
        animated: true
    },
    {
        id: 'plasma',
        name: 'Plasma',
        gradient: 'linear-gradient(135deg, #00c9ff, #92fe9d)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209625722-7a7ffa83-f44c-4a6b-93b5-32474236fe94.gif',
        animated: true
    },
    {
        id: 'inferno',
        name: 'Inferno',
        gradient: 'linear-gradient(135deg, #f83600, #f9d423)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209642124-8de07088-6665-4f8f-b42a-e0572b3f468e.gif',
        animated: true
    },
    {
        id: 'vortex',
        name: 'Vortex',
        gradient: 'linear-gradient(135deg, #0f0c29, #302b63)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209642130-a31ad8c4-d125-4623-bbbd-904824928f5c.gif',
        animated: true
    },
    {
        id: 'aurora',
        name: 'Aurora',
        gradient: 'linear-gradient(135deg, #00c9ff, #92fe9d)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209642135-64e5c1d2-ef3e-48b2-837f-33ba0be22bd3.gif',
        animated: true
    },
    {
        id: 'cyberwave',
        name: 'Cyberwave',
        gradient: 'linear-gradient(135deg, #b721ff, #21d4fd)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209642170-6e844de7-6396-44b2-bc71-71dafbbd316c.gif',
        animated: true
    },
    {
        id: 'magma',
        name: 'Magma',
        gradient: 'linear-gradient(135deg, #f12711, #f5af19)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209625716-5dae539d-65d1-4703-b04d-ca5e839f8c61.gif',
        animated: true
    },
    {
        id: 'storm',
        name: 'Storm',
        gradient: 'linear-gradient(135deg, #0061ff, #60efff)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209642206-fcfbc935-7b5e-4912-8293-156bcf67ff03.gif',
        animated: true
    },
    {
        id: 'cosmos',
        name: 'Cosmos',
        gradient: 'linear-gradient(135deg, #fc00ff, #00dbde)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209642192-97d027db-db77-496b-8f68-0f1d8452d819.gif',
        animated: true
    },
    {
        id: 'toxic',
        name: 'Toxic',
        gradient: 'linear-gradient(135deg, #56ab2f, #a8e063)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209642212-ec8ba881-2a1b-49dd-a29b-a5a65786cc31.gif',
        animated: true
    },
    {
        id: 'glitch',
        name: 'Glitch',
        gradient: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209649107-aa61a628-5d25-42e8-bb72-def187f9c88c.gif',
        animated: true
    },
    {
        id: 'midnight',
        name: 'Midnight',
        gradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        gifUrl: 'https://user-images.githubusercontent.com/75514601/209649028-f849c6d7-a2d5-46fc-b6be-d2b71083190f.gif',
        animated: true
    },
    {
        id: 'default',
        name: 'Default',
        gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.25))',
        animated: false
    }
];
