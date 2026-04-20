type CartEventPayload = {
  image: string;
};

let listeners: ((data: CartEventPayload) => void)[] = [];

export const emitAddToCart = (data: CartEventPayload) => {
  listeners.forEach((l) => l(data));
};

export const onAddToCart = (cb: (data: CartEventPayload) => void) => {
  listeners.push(cb);

  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
};