// Light-mode shim for Chakra's removed useColorModeValue helper
export function useColorModeValue<T>(lightValue: T, _darkValue: T): T {
  return lightValue;
}

export default useColorModeValue;
