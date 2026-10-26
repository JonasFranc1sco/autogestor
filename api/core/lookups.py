"""Consulta de CEP e placa em serviços externos (com fallback gracioso)."""
import json
import urllib.error
import urllib.request

from django.conf import settings


class LookupError(Exception):
    """Falha de consulta externa (serviço indisponível ou não configurado)."""


class NotFoundError(Exception):
    """Registro não encontrado na origem."""


class InvalidValueError(Exception):
    """Valor informado fora do formato esperado."""


def _get_json(url: str, headers: dict | None = None, timeout: float = 5.0):
    request = urllib.request.Request(url, headers={"Accept": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        if error.code == 404:
            raise NotFoundError()
        raise LookupError(f"Serviço externo respondeu {error.code}.")
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise LookupError("Serviço externo indisponível.")


def fetch_cep(cep: str) -> dict:
    """Normaliza os dados de endereço de um CEP (BrasilAPI com fallback ViaCEP)."""
    digits = "".join(ch for ch in cep if ch.isdigit())
    if len(digits) != 8:
        raise InvalidValueError("CEP deve conter 8 dígitos.")

    try:
        data = _get_json(f"https://brasilapi.com.br/api/cep/v1/{digits}")
        return {
            "cep": digits,
            "street": data.get("street") or "",
            "neighborhood": data.get("neighborhood") or "",
            "city": data.get("city") or "",
            "state": (data.get("state") or "").upper()[:2],
        }
    except NotFoundError:
        raise
    except LookupError:
        pass  # tenta o segundo provedor

    try:
        data = _get_json(f"https://viacep.com.br/ws/{digits}/json/")
    except NotFoundError:
        raise
    except LookupError as error:
        raise LookupError(str(error))

    if data.get("erro"):
        raise NotFoundError()

    return {
        "cep": digits,
        "street": data.get("logradouro") or "",
        "neighborhood": data.get("bairro") or "",
        "city": data.get("localidade") or "",
        "state": data.get("uf") or "",
    }
