# React Slam Library

## Why

Because I was bored and wanted to make something fun.

## Dependencies

The react-slam library depends on the following:

-   **[React](https://react.dev/?uwu=true)**: A JavaScript library for building user interfaces.
-   **[Matter.js](https://brm.io/matter-js/)**: A 2D physics engine for the web.

## Installation Steps

To install react-slam, you can use npm or yarn. Run one of the following commands in your project directory:

```bash
npm install react-slam matter-js
```

or

```bash
yarn add react-slam matter-js
```

## Usage

To use the react-slam library, wrap your application or the part of your application where you want to enable physics collisions with the SlamProvider. For the components which you want to have physics applied to them, use the withSlam Higher-Order Component (HOC). The useSlam hook is used to control the physics engine, such as starting it.

Example:

```ts
import { SlamProvider, useSlam, withSlam } from 'react-slam';

const App = () => {
    return (
        <SlamProvider
            debug={true}
            floorThickness={10}
        >
            <YourView />
        </SlamProvider>
    );
};

const YourView = () => {
    const { startEngine } = useSlam();

    useEffect(() => {
        startEngine();
    }, [startEngine]);

    return (
        <div>
            <YourSlamComponent />
        </div>
    );
};

const YourFunctionComponent = React.forwardRef((props, ref) => {
    return <div ref={ref}>Your content here</div>;
});

const YourSlamComponent = withSlam(YourFunctionComponent);
```

## Provider Options

The `SlamProvider` accepts the following optional props:

-   `floorThickness`: Sets the thickness of the floor.
-   `debug`: If set to true, it renders the rigid bodies for debugging purposes.

## HOC Props

The `withSlam` HOC adds the following props:

-   `delay`: (optional) Specifies the delay in milliseconds before the physics simulation starts for this component.
-   `excludeChildren`: (optional) If set to true, excludes child elements from the physics simulation.
-   `constraint`: (optional) Defines the constraint point for the component. Can be 'tl' (top-left), 'tr' (top-right), 'bl' (bottom-left), or 'br' (bottom-right).
-   `restitution`: (optional) Sets the bounciness of the component in the physics simulation.
-   `initialAngularVelocity`: (optional) Specifies the initial rotational speed of the component when the physics simulation starts.

These props allow you to fine-tune the behavior of each component in the physics simulation.
