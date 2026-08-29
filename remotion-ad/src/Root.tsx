import React from 'react';
import { Composition } from 'remotion';
import { HasstyAd } from './HasstyAd';

export const Root: React.FC = () => (
  <Composition
    id="HasstyAd"
    component={HasstyAd}
    durationInFrames={450}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{}}
  />
);
