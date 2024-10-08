import invariant from 'invariant';
import Matter from 'matter-js';
import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

const NO_CONTEXT = 'No Slam provider found';

const Bodies = Matter.Bodies
const Constraint = Matter.Constraint
const Engine = Matter.Engine
const Mouse = Matter.Mouse
const MouseConstraint = Matter.MouseConstraint
const Render = Matter.Render
const Runner = Matter.Runner
const World = Matter.World

export interface SlamProps {
    delay?: number;
    excludeChildren?: boolean;
    constraint?: 'tl' | 'tr' | 'bl' | 'br';
    restitution?: number;
    initialAngularVelocity?: number;
}

interface ISlamContext {
    registerRigidBody: (ref: React.RefObject<HTMLElement>, { ...props }: SlamProps) => void;
    startEngine: () => void;
}

export interface ISlam extends Omit<ISlamContext, 'registerRigidBody'> { }


const SlamContext = createContext<ISlamContext>({
    registerRigidBody: () => {
        throw new Error(NO_CONTEXT);
    },
    startEngine: () => {
        throw new Error(NO_CONTEXT);
    },
});

export interface SlamProviderProps extends PropsWithChildren {
    debug?: boolean;
    floorThickness?: number;
}

export const SlamProvider: React.FC<SlamProviderProps> = ({ children, debug = false, floorThickness = 10 }) => {
    const boxRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const registeredRefs = useRef<
        Set<{
            ref: React.RefObject<HTMLElement>;
            delay?: number;
            excludeChildren?: boolean;
            constraint?: 'tl' | 'tr' | 'bl' | 'br';
            restitution: number;
            initialAngularVelocity: number;
        }>
    >(new Set());
    const engine = useRef<Matter.Engine>(
        Engine.create({
            gravity: {
                y: 1,
            },
        })
    ).current;

    const runner = useRef<Matter.Runner>(
        Runner.create({
            // 300Hz delta = 1.666ms = 10upf @ 60fps (i.e. 5x default precision)
            delta: 1000 / (30 * 10),
            enabled: false,
        })
    ).current;

    const render = useRef<Matter.Render>();

    const floorRef = useRef<Matter.Body>(
        Bodies.rectangle(0, 0, 0, floorThickness, {
            isStatic: true,
            restitution: 0.5,
            render: {
                fillStyle: 'blue',
            },
        })
    );
    const rightWallRef = useRef<Matter.Body>(
        Bodies.rectangle(0, 0, 0, floorThickness, {
            isStatic: true,
            restitution: 0.5,
            render: {
                fillStyle: 'blue',
            },
        })
    );
    const leftWallRef = useRef<Matter.Body>(
        Bodies.rectangle(0, 0, 0, floorThickness, {
            isStatic: true,
            restitution: 0.5,
            render: {
                fillStyle: 'blue',
            },
        })
    );

    const [running, setRunning] = useState(false);

    useEffect(() => {
        World.add(engine.world, [floorRef.current, rightWallRef.current, leftWallRef.current]);
        window.addEventListener('resize', onViewportChange);
        window.addEventListener('scroll', onViewportChange);

        render.current = Render.create({
            canvas: canvasRef.current!,
            engine: engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: true,
                showMousePosition: debug,
            },
        });
        onViewportChange();

        return () => {
            window.removeEventListener('resize', onViewportChange);
            window.removeEventListener('scroll', onViewportChange);
        }
    }, []);

    const startEngine = useCallback(() => {
        if (running) return;
        setRunning(true);
        // Make all registered refs invisible
        registeredRefs.current.forEach(
            ({ ref, delay, excludeChildren, constraint, restitution, initialAngularVelocity }) => {
                if (ref.current) {
                    setTimeout(() => {
                        ref.current!.style.visibility = 'hidden';

                        // Set overflow on parent to show
                        if (ref.current!.parentElement) {
                            ref.current!.parentElement.style.overflow = 'visible';
                            //also set grandparent to visible
                            if (ref.current!.parentElement?.parentElement) {
                                ref.current!.parentElement.parentElement.style.overflow = 'visible';
                            }
                        }

                        const position = ref.current!.getBoundingClientRect();

                        const body = Bodies.rectangle(
                            position.x + position.width / 2,
                            position.y + position.height / 2,
                            position.width,
                            position.height,
                            {
                                render: {
                                    fillStyle: 'blue',
                                },
                                restitution: restitution,
                            }
                        );

                        if (constraint) {
                            const xPoint =
                                constraint === 'tl' || constraint === 'bl'
                                    ? position.x + 10
                                    : position.x + position.width - 10;
                            const yPoint =
                                constraint === 'tl' || constraint === 'tr'
                                    ? position.y + 10
                                    : position.y + position.height - 10;
                            const newConstraint = Constraint.create({
                                pointA: {
                                    x: xPoint,
                                    y: yPoint,
                                },
                                pointB: {
                                    x: xPoint,
                                    y: yPoint,
                                },
                                bodyB: body,
                                stiffness: 0.4,
                                length: 1,
                            });
                            World.add(engine.world, newConstraint);
                        }

                        body.angle = initialAngularVelocity;

                        World.add(engine.world, body);

                        let clone = ref.current!.cloneNode(!excludeChildren) as HTMLElement;
                        clone.id = 'clone' + ref.current!.id;
                        clone.style.margin = '0';
                        clone.style.opacity = '1';
                        clone.style.visibility = 'visible';
                        // Create a wrapper div for the clone
                        const wrapper = document.createElement('div');
                        wrapper.style.position = 'absolute';
                        wrapper.style.width = `${position.width}px`;
                        wrapper.style.height = `${position.height}px`;
                        wrapper.style.zIndex = '2000';
                        wrapper.style.pointerEvents = 'none';
                        // Set background color based on theme
                        const themeMode = localStorage.getItem('colorMode') || 'light';
                        const backgroundColor = themeMode === 'dark' ? '#121212' : '#ffffff';
                        wrapper.style.backgroundColor = backgroundColor;

                        // Append clone to wrapper
                        wrapper.appendChild(clone);
                        clone = wrapper;
                        //set shadow on close
                        clone.style.boxShadow = '0 0 5px 0 rgba(0, 0, 0, 0.3)';
                        clone = document.body.appendChild(clone);

                        const updatePosition = () => {
                            if (clone && body.position) {
                                // update the position of the clone to match the rigid body
                                clone.style.transform = `rotate(${body.angle}rad)`;
                                clone.style.left = `${body.position.x - position.width / 2}px`;
                                clone.style.top = `${body.position.y - position.height / 2}px`;
                            }
                        };

                        Matter.Events.on(engine, 'afterUpdate', updatePosition);
                    }, delay ?? 0);
                }
            }
        );

        const mouse = Mouse.create(canvasRef.current!),
            mouseConstraint = MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.1,
                    render: {
                        visible: debug,
                    },
                },
            });
        World.add(engine.world, mouseConstraint);

        runner.enabled = true;
        Runner.run(runner, engine);

        render.current!.mouse = mouse;
        Render.run(render.current!);

        return () => {
            Runner.stop(runner);
            World.clear(engine.world, true);
            Engine.clear(engine);

        };
    }, [running]);

    const onViewportChange = () => {
        const bounds = boxRef.current!.getBoundingClientRect();
        const { width, height } = bounds;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        // Set the floor's position and size, and make it bouncy
        Matter.Body.setPosition(floorRef.current, {
            x: width / 2 + scrollX,
            y: height + scrollY,
        });

        Matter.Body.setVertices(floorRef.current, [
            { x: scrollX, y: height - floorThickness * 0.01 + scrollY },
            { x: width + scrollX, y: height - floorThickness * 0.01 + scrollY },
            { x: width + scrollX, y: height + floorThickness * 0.09 + scrollY }, // Extend below the visible area
            { x: scrollX, y: height + floorThickness * 0.09 + scrollY },
        ]);

        Matter.Body.setPosition(rightWallRef.current, {
            x: width + scrollX,
            y: height / 2 + scrollY,
        });

        Matter.Body.setPosition(leftWallRef.current, {
            x: scrollX,
            y: height / 2 + scrollY,
        });

        Matter.Body.setVertices(rightWallRef.current, [
            { x: width - floorThickness * 0.01 + scrollX, y: scrollY },
            { x: width - floorThickness * 0.01 + scrollX, y: height + scrollY },
            { x: width + floorThickness * 0.99 + scrollX, y: height + scrollY },
            { x: width + floorThickness * 0.99 + scrollX, y: scrollY },
        ]);

        Matter.Body.setVertices(leftWallRef.current, [
            { x: -floorThickness * 0.01 + scrollX, y: scrollY },
            { x: -floorThickness * 0.01 + scrollX, y: height + scrollY },
            { x: -floorThickness * 0.99 + scrollX, y: height + scrollY },
            { x: -floorThickness * 0.99 + scrollX, y: scrollY },
        ]);

        render.current!.canvas.width = width;
        render.current!.canvas.height = height;
    };

    const registerRigidBody = useCallback(
        (
            ref: React.RefObject<HTMLElement>,
            {
                delay,
                excludeChildren,
                constraint,
                restitution,
                initialAngularVelocity,
            }: SlamProps
        ) => {
            if (
                registeredRefs.current.has({
                    ref,
                    delay,
                    excludeChildren,
                    constraint,
                    restitution: restitution ?? 0.9,
                    initialAngularVelocity: initialAngularVelocity ?? 0,
                })
            ) {
                return; // If the ref is already registered, do nothing
            }
            registeredRefs.current.add({
                ref,
                delay,
                excludeChildren,
                constraint,
                restitution: restitution ?? 0.9,
                initialAngularVelocity: initialAngularVelocity ?? 0,
            });
        },
        []
    );

    return (
        <>
            <SlamContext.Provider value={{ registerRigidBody, startEngine }}>
                {children}
            </SlamContext.Provider>
            <div
                ref={boxRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    zIndex: 2000,
                    pointerEvents: running ? 'auto' : 'none',
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{ opacity: debug ? 0.5 : 0 }}
                />
            </div>
        </>
    );
};

export const useSlam = (): ISlam => {
    const { startEngine } = useContext(SlamContext)
    return { startEngine }
}

export const withSlam = <P extends object>(
    WrappedComponent: React.ComponentType<P>
) => {

    invariant(
        typeof WrappedComponent !== 'function' ||
        (WrappedComponent.prototype && WrappedComponent.prototype.isReactComponent),
        `Looks like you're passing a function component \`$ {WrappedComponent.name}\` to \`withSlam\` function which supports only class components. Please wrap your function component with \`React.forwardRef()\` or use a class component instead.`
    );

    const WithPhysics: React.FC<P & SlamProps> = (props) => {
        const { registerRigidBody } = useContext(SlamContext);
        const ref = useRef<HTMLElement>(null);
        const registered = useRef(false);

        const { delay, excludeChildren, constraint, restitution, initialAngularVelocity, ...componentProps } = props;

        useEffect(() => {
            if (ref.current && !registered.current) {
                registered.current = true;
                registerRigidBody(ref, { delay, excludeChildren, constraint, restitution, initialAngularVelocity });
            }
        }, [delay, excludeChildren, constraint, restitution, initialAngularVelocity, registerRigidBody]);

        return (
            <WrappedComponent
                {...componentProps as P}
                ref={ref}
            />
        );
    };

    WithPhysics.displayName = `WithPhysics(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return WithPhysics;
};