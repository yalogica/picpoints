import { Events, Event, EventType, EventHandler } from '@/events';
import { Node } from '@/node';
import { InteractiveMap } from '@/interactivemap';


export const coreNodeAdd = Symbol('nodeAdd');
export const coreNodeRemove = Symbol('nodeRemove');

export class Core {
    private static _instance: Core;
    
    private _listeners: {
        [T in EventType]?: Array<EventHandler<T>>
    } = {};
    
    private _store: Map<string, Node> = new Map<string, Node>();

    /**
    * The current version of the plugin
    */
    version: string = '@@version';

    /**
    * Show different warnings about errors or wrong API usage
    * @example
    * PicPoints.showWarnings = false;
    */
    showWarnings: boolean = true;

    private constructor() {
    };

    private [coreNodeAdd](node: Node): void {
        this._store.set(node.id, node);
    };

    private [coreNodeRemove](node: Node | string): void {
        this._store.delete(typeof node === 'string' ? node : node.id);
    };

    static getInstance(): Core {
        if (!Core._instance) {
            Core._instance = new Core();
        }
        return Core._instance;
    };

    hasNode(id: string): boolean {
        return this._store.has(id);
    };

    getNode(id: string): Node | null {
        return this._store.get(id) ?? null;
    };

    /**
    * Registers a listener for the specified event.
    * 
    * @param type - The type of event for which the listener will be registered.
    * @param handler - The callback function that will be invoked when the event occurs.
    */
    on<T extends EventType>(type: T, handler: EventHandler<T>): void {
        if (!this._listeners[type]) this._listeners[type] = [];
        this._listeners[type]!.push(handler);
    };

    /**
     * Removes a previously registered listener for the specified event.
     * 
     * @param type - The type of event for which the listener will be removed.
     * @param handler - The callback function that needs to be removed.
     */
    off<T extends EventType>(type: T, handler?: EventHandler<T>): void {
        if (!this._listeners[type]) return;
        
        if (handler) {
            const index = (this._listeners[type] as EventHandler<T>[]).indexOf(handler);
            if (index !== -1) {
                this._listeners[type]!.splice(index, 1);
            }
        } else {
            delete this._listeners[type];
        }
    };

    /**
     * Triggers all registered listeners for the specified event,
     * passing additional data to them if provided.
     * 
     * @param type - The type of event for which the listeners will be triggered.
     * @param node - The source of the event, typically the object that triggered the event (e.g., a `InteractiveMap`, `MapBoard`, or `Shape`).
     * @param data - Additional data to be passed to the listeners (optional parameter).
     */
    fire<T extends EventType>(type: T, source?: Node | InteractiveMap, data?: Events[T]): void {
        const event: Event<T> = { type, source, data };
        (this._listeners[type] as EventHandler<T>[] | undefined)?.forEach(handler => handler(event));
    };
};