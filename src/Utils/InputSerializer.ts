import { OnlineInputState, KeyNames } from "../Configs/KeyBound";

export class InputSerializer {
    static serialize(inputState: OnlineInputState): string {
        return JSON.stringify(inputState);
    }

    static deserialize(serializedInputState: string): OnlineInputState {
        return JSON.parse(serializedInputState);
    }

    static createEmptyInputState(): OnlineInputState {
        const state: OnlineInputState = {} as OnlineInputState;
        KeyNames.forEach((keyName) => {
            state[keyName] = false;
        });
        return state;
    }
}