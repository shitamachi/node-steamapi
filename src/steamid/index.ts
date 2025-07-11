import { PossibleUniverses, Universes, PossibleTypes, Types, PossibleInstances, Instances } from './enums.js';

class SteamID {
    /**
     * List of possible universes
     */
    static get Universe(): PossibleUniverses {
        return Universes;
    }

    /**
     * List of possible types
     */
    static get Type(): PossibleTypes {
        return Types;
    }

    /**
     * List of named instances
     */
    static get Instance(): PossibleInstances {
        return Instances;
    }

    /**
     * Mapping of SteamID types to their characters
     */
    static get TypeChars(): { [idType: string]: string } {
        return {
            [SteamID.Type.INVALID]: 'I',
            [SteamID.Type.INDIVIDUAL]: 'U',
            [SteamID.Type.MULTISEAT]: 'M',
            [SteamID.Type.GAMESERVER]: 'G',
            [SteamID.Type.ANON_GAMESERVER]: 'A',
            [SteamID.Type.PENDING]: 'P',
            [SteamID.Type.CONTENT_SERVER]: 'C',
            [SteamID.Type.CLAN]: 'g',
            [SteamID.Type.CHAT]: 'T',
            [SteamID.Type.ANON_USER]: 'a'
        };
    }

    /**
     * Mask to be used to get the AccountID out of a 64-bit SteamID
     * @static
     * @returns {number}
     */
    static get AccountIDMask(): number { return 0xFFFFFFFF; }

    /**
     * Mask to be used to get the instance out of the upper 32 bits of a 64-bit SteamID
     */
    static get AccountInstanceMask(): number { return 0x000FFFFF; }

    /**
     * Flags in SteamID instance for chat type IDs
     */
    static get ChatInstanceFlags(): { Lobby: number, Clan: number, MMSLobby: number } {
        return {
            Clan: (SteamID.AccountInstanceMask + 1) >> 1,
            Lobby: (SteamID.AccountInstanceMask + 1) >> 2,
            MMSLobby: (SteamID.AccountInstanceMask + 1) >> 3
        };
    }

    universe: Universes;
    type: Types;
    instance: number;
    accountid: number;

    /**
     * Create a new SteamID object.
     * @param {string|BigInt} [input] - BigInt containing 64-bit SteamID, or string containing 64-bit SteamID/Steam2/Steam3 text formats. If omitted, creates a blank SteamID object.
     */
    constructor(input?: string | bigint | null) {
        this.universe = SteamID.Universe.INVALID;
        this.type = SteamID.Type.INVALID;
        this.instance = SteamID.Instance.ALL;
        this.accountid = 0;

        if (!input) {
            // Use the default invalid values
            return;
        }

        let matches;
        if (typeof input == 'bigint' || (typeof input == 'string' && input.match(/^\d+$/))) {
            // 64-bit ID
            let num = BigInt(input);
            this.accountid = Number(num & BigInt(SteamID.AccountIDMask));
            this.instance = Number((num >> 32n) & BigInt(SteamID.AccountInstanceMask));
            this.type = Number((num >> 52n) & 0xFn);
            this.universe = Number(num >> 56n);
        } else if (typeof input == 'string' && (matches = input.match(/^STEAM_([0-5]):([0-1]):([0-9]+)$/))) {
            // Steam2 ID
            let [_, universe, mod, accountid] = matches;

            this.universe = parseInt(universe, 10) || SteamID.Universe.PUBLIC; // If it's 0, turn it into 1 for public
            this.type = SteamID.Type.INDIVIDUAL;
            this.instance = SteamID.Instance.DESKTOP;
            this.accountid = (parseInt(accountid, 10) * 2) + parseInt(mod, 10);
        } else if (typeof input == 'string' && (matches = input.match(/^\[([a-zA-Z]):([0-5]):([0-9]+)(:[0-9]+)?]$/))) {
            // Steam3 ID
            let [_, typeChar, universe, accountid, instanceid] = matches;

            this.universe = parseInt(universe, 10);
            this.accountid = parseInt(accountid, 10);

            if (instanceid) {
                this.instance = parseInt(instanceid.substring(1), 10);
            }

            switch (typeChar) {
                case 'U':
                    // Individual. If we don't have an explicit instanceid, default to DESKTOP.
                    this.type = SteamID.Type.INDIVIDUAL;
                    if (!instanceid) {
                        this.instance = SteamID.Instance.DESKTOP;
                    }
                    break;

                case 'c':
                    this.instance |= SteamID.ChatInstanceFlags.Clan;
                    this.type = SteamID.Type.CHAT;
                    break;

                case 'L':
                    this.instance |= SteamID.ChatInstanceFlags.Lobby;
                    this.type = SteamID.Type.CHAT;
                    break;

                default:
                    this.type = getTypeFromChar(typeChar);
            }
        } else {
            throw new Error(`Unknown SteamID input format "${input}"`);
        }
    }

    /**
     * Creates a new SteamID object from an individual account ID.
     */
    static fromIndividualAccountID(accountid: number | bigint | string): SteamID {
        if (typeof accountid == 'bigint') {
            accountid = Number(accountid);
        }

        let parsed = parseInt(accountid.toString(), 10);
        if (isNaN(parsed)) {
            // Safe warning for WASM environments
            if (typeof globalThis !== 'undefined' && 
                globalThis.console && 
                typeof globalThis.console.error === 'function') {
                globalThis.console.error(`[steamid] Warning: SteamID.fromIndividualAccountID() called with NaN argument "${accountid}" (type "${typeof accountid}")`);
            } else if (typeof console !== 'undefined' && 
                       typeof console.error === 'function') {
                console.error(`[steamid] Warning: SteamID.fromIndividualAccountID() called with NaN argument "${accountid}" (type "${typeof accountid}")`);
            }
            parsed = 0;
        }

        let sid = new SteamID();
        sid.universe = SteamID.Universe.PUBLIC;
        sid.type = SteamID.Type.INDIVIDUAL;
        sid.instance = SteamID.Instance.DESKTOP;
        sid.accountid = parsed;
        return sid;
    }

    /**
     * Returns whether Steam would consider a given ID to be "valid".
     * This does not check whether the given ID belongs to a real account, nor does it check that the given ID is for
     * an individual account or in the public universe.
     */
    isValid(): boolean {
        fixTypes(this);

        if (this.type <= SteamID.Type.INVALID || this.type > SteamID.Type.ANON_USER) {
            return false;
        }

        if (this.universe <= SteamID.Universe.INVALID || this.universe > SteamID.Universe.DEV) {
            return false;
        }

        if (this.type == SteamID.Type.INDIVIDUAL && (this.accountid === 0 || this.instance > SteamID.Instance.WEB)) {
            return false;
        }

        if (this.type == SteamID.Type.CLAN && (this.accountid === 0 || this.instance != SteamID.Instance.ALL)) {
            return false;
        }

        // noinspection RedundantIfStatementJS
        if (this.type == SteamID.Type.GAMESERVER && this.accountid === 0) {
            return false;
        }

        return true;
    }

    /**
     * Returns whether this SteamID is valid and belongs to an individual user in the public universe with a desktop instance.
     * This is what most people think of when they think of a SteamID. Does not check whether the account actually exists.
     */
    isValidIndividual(): boolean {
        return this.universe == SteamID.Universe.PUBLIC
            && this.type == SteamID.Type.INDIVIDUAL
            && this.instance == SteamID.Instance.DESKTOP
            && this.isValid();
    }

    /**
     * Checks whether the given ID is for a legacy group chat.
     */
    isGroupChat(): boolean {
        fixTypes(this);
        return !!(this.type == SteamID.Type.CHAT && this.instance & SteamID.ChatInstanceFlags.Clan);
    }

    /**
     * Check whether the given Id is for a game lobby.
     */
    isLobby(): boolean {
        fixTypes(this);
        return !!(this.type == SteamID.Type.CHAT && (this.instance & SteamID.ChatInstanceFlags.Lobby || this.instance & SteamID.ChatInstanceFlags.MMSLobby));
    }

    /**
     * Renders the ID in Steam2 format (e.g. "STEAM_0:0:23071901")
     * @param {boolean} [newerFormat=false] - If true, use 1 as the first digit instead of 0 for the public universe
     */
    steam2(newerFormat: boolean = false): string {
        fixTypes(this);
        if (this.type != SteamID.Type.INDIVIDUAL) {
            throw new Error('Can\'t get Steam2 rendered ID for non-individual ID');
        } else {
            let universe = this.universe;
            if (!newerFormat && universe === 1) {
                universe = 0;
            }

            return `STEAM_${universe}:${this.accountid & 1}:${Math.floor(this.accountid / 2)}`;
        }
    }

    /**
     * Renders the ID in Steam2 format (e.g. "STEAM_0:0:23071901")
     * @param {boolean} [newerFormat=false] - If true, use 1 as the first digit instead of 0 for the public universe
     */
    getSteam2RenderedID(newerFormat: boolean = false): string {
        return this.steam2(newerFormat);
    }

    /**
     * Renders the ID in Steam3 format (e.g. "[U:1:46143802]")
     */
    steam3(): string {
        fixTypes(this);
        let typeChar = SteamID.TypeChars[this.type] || 'i';

        if (this.instance & SteamID.ChatInstanceFlags.Clan) {
            typeChar = 'c';
        } else if (this.instance & SteamID.ChatInstanceFlags.Lobby) {
            typeChar = 'L';
        }

        let shouldRenderInstance = (
            this.type == SteamID.Type.ANON_GAMESERVER ||
            this.type == SteamID.Type.MULTISEAT ||
            (
                this.type == SteamID.Type.INDIVIDUAL &&
                this.instance != SteamID.Instance.DESKTOP
            )
        );

        return `[${typeChar}:${this.universe}:${this.accountid}${shouldRenderInstance ? `:${this.instance}` : ''}]`;
    }

    /**
     * Renders the ID in Steam3 format (e.g. "[U:1:46143802]")
     */
    getSteam3RenderedID(): string {
        return this.steam3();
    }

    /**
     * Renders the ID in 64-bit decimal format, as a string (e.g. "76561198006409530")
     */
    getSteamID64(): string {
        return this.getBigIntID().toString();
    }

    /**
     * Renders the ID in 64-bit decimal format, as a string (e.g. "76561198006409530")
     */
    toString(): string {
        return this.getSteamID64();
    }

    /**
     * Renders the ID in 64-bit decimal format, as a BigInt (e.g. 76561198006409530n)
     */
    getBigIntID(): bigint {
        fixTypes(this);
        let universe = BigInt(this.universe);
        let type = BigInt(this.type);
        let instance = BigInt(this.instance);
        let accountid = BigInt(this.accountid);

        return (universe << 56n) | (type << 52n) | (instance << 32n) | accountid;
    }
}

// Private methods/functions
function getTypeFromChar(typeChar: string): number {
    let charEntry = Object.entries(SteamID.TypeChars).find(([entryType, entryChar]) => entryChar == typeChar);
    return charEntry ? parseInt(charEntry[0], 10) : SteamID.Type.INVALID;
}

function fixTypes(sid: { universe: any, type: any, instance: any, accountid: any }) {
    const props = ['universe', 'type', 'instance', 'accountid'] as const;
    props.forEach((prop) => {
        if (typeof sid[prop] == 'bigint') {
            // Not sure how this would ever happen, but fix it
            sid[prop] = Number(sid[prop]);
        } else {
            let val = parseInt(sid[prop], 10);
            if (!isNaN(val)) {
                sid[prop] = val;
            }
        }
    });
}

export default SteamID;