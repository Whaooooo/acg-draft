// src/types/assets.d.ts

declare module '*.jpg' {
    const value: string;
    export default value;
}

declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.mp3' {
    const value: string;
    export default value;
}

declare module '*.ogg' {
    const value: string;
    export default value;
}

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}
