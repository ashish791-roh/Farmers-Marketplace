type FlyPayload = {
  image: string;
  startRect: DOMRect;
};

let listeners: ((data: FlyPayload) => void)[] = [];

export const triggerFlyToCart = (data: FlyPayload) => {
  listeners.forEach((l) => l(data));
};

export const onFlyToCart = (cb: (data: FlyPayload) => void) => {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
};