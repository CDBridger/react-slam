# React Slam Library

## Dependencies

The react-slam library depends on the following:

-   **React**: A JavaScript library for building user interfaces.
-   **Matter.js**: A 2D physics engine for the web.

## Installation Steps

To install react-slam, you can use npm or yarn. Run one of the following commands in your project directory:

```bash
npm install react-slam
```

or

```bash
yarn add react-slam
```

## Usage

To use the react-slam library, wrap your application or the part of your application where you want to enable physics collisions with the SlamProvider. For components that need physics applied to them, use the withSlam Higher-Order Component (HOC). The useSlam hook is used to control the physics engine, such as starting it.

Example:

```ts
import { SlamProvider, useSlam, withSlam } from 'react-slam';

const App = () => {
    return (
        <SlamProvider
            debug={true}
            floorThickness={10}
        >
            <SlamComponent />
        </SlamProvider>
    );
};

const YourComponent = () => {
    const { startEngine } = useSlam();

    // Component logic here

    return <div>Your content here</div>;
};

const SlamComponent = withSlam(YourComponent);
```

## Provider Options

The `SlamProvider` accepts the following optional props:

-   `floorThickness`: Sets the thickness of the floor.
-   `debug`: If set to true, it renders the rigid bodies for debugging purposes.
