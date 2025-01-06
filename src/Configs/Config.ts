function addLocalConfig<K extends string, T extends { [key in K]: unknown }>(cfg: T, key: K) {
    const local = localStorage.getItem(key);
    if (local) {
        cfg[key] = JSON.parse(local);
    }
    let value = cfg[key];
    Object.defineProperty(cfg, key, {
        get: () => value,
        set: (new_value: any) => {
            value = new_value;
            localStorage.setItem(key, JSON.stringify(value));
        }
    });
}

const Config = {
    assetsPath: 'assets/',
    websocketPort: 48002,
    bgmVolume: 1.0,
    fps: 60,
    fov: 75,
};

addLocalConfig(Config, 'bgmVolume');
addLocalConfig(Config, 'fps');
addLocalConfig(Config, 'fov');

(document.getElementById('bgm') as HTMLAudioElement).volume = Config.bgmVolume

export { Config };