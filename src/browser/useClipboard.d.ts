export interface ClipboardState {
    copied: boolean;
    error: Error | null;
}
export declare const useClipboard: (timeout?: number) => {
    copied: boolean;
    error: Error | null;
    copy: (text: string) => Promise<boolean>;
};
