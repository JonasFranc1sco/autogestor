"""Validação de dígitos verificadores de CPF e CNPJ (espelha o front)."""
import re

ONLY_DIGITS = re.compile(r"\D")


def _digits(value: str) -> str:
    return ONLY_DIGITS.sub("", value or "")


def normalize_digits(value: str | None) -> str:
    """Remove qualquer pontuação/caractere não numérico de CPF/CNPJ."""
    return ONLY_DIGITS.sub("", value or "")


def _check_digit(base: str, factor: int) -> str:
    total = sum(int(char) * (factor - index) for index, char in enumerate(base))
    rest = (total * 10) % 11
    return "0" if rest == 10 else str(rest)


def is_valid_cpf(value: str) -> bool:
    digits = _digits(value)
    if len(digits) != 11 or digits == digits[0] * 11:
        return False
    d1 = _check_digit(digits[:9], 10)
    d2 = _check_digit(digits[:10], 11)
    return digits[9] == d1 and digits[10] == d2


def is_valid_cnpj(value: str) -> bool:
    digits = _digits(value)
    if len(digits) != 14 or digits == digits[0] * 14:
        return False

    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    def calc(base: str, weights: list[int]) -> str:
        total = sum(int(char) * weight for char, weight in zip(base, weights))
        rest = total % 11
        return "0" if rest < 2 else str(11 - rest)

    d1 = calc(digits[:12], weights1)
    d2 = calc(digits[:13], weights2)
    return digits[12] == d1 and digits[13] == d2


def is_valid_cpf_cnpj(value: str) -> bool:
    digits = _digits(value)
    if len(digits) == 11:
        return is_valid_cpf(digits)
    if len(digits) == 14:
        return is_valid_cnpj(digits)
    return False
