import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

const STORAGE_CART = '@GoMartketPlace_cart';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];

  addToCart(item: Product): void;

  increment(id: string): void;

  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({children}) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();

      try {
        const productsFromStorage = await AsyncStorage.getItem(STORAGE_CART);

        if (productsFromStorage === null) return;

        setProducts(JSON.parse(productsFromStorage));
      } catch (error) {
        console.warn(error);
      }
    }

    loadProducts();
  }, []);

  async function storeProducts(
    productsToStore: Product[],
    name: string,
  ): Promise<void> {
    console.log(`store called ${name}${JSON.stringify(productsToStore)}`);

    setProducts(productsToStore)
    await AsyncStorage.setItem(STORAGE_CART, JSON.stringify(productsToStore));
  }

  const addToCart = useCallback(
    async product => {

      let productsList: Product[] = [...products];

      const productIndex = productsList.findIndex(item => item.id === product.id);

      if (productIndex > -1) {
        productsList[productIndex].quantity += 1;
        await storeProducts(productsList, 'addtocart');
        return;
      }

      productsList.push({...product, quantity: 1})

      await storeProducts(productsList, 'addtocart');
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsWithIncrement = products.map(product =>
        product.id === id
          ? {...product, quantity: product.quantity + 1}
          : product,
      );
      await storeProducts(productsWithIncrement, 'inc');
    },
    [products],
  );

  const decrement = useCallback(
    async id => {


      const productsWithDecrement: Product[] = products.map(item => {
        if (item.id === id) {
          return {...item, quantity: (item.quantity -= 1)}
        }
        return item;
      });

      const newList = productsWithDecrement.filter(item => item.quantity > 0)

      await storeProducts(newList, 'dec')

      // setProducts(newList);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({addToCart, increment, decrement, products}),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export {CartProvider, useCart};
