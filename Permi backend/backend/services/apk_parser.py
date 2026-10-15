
import logging
from pathlib import Path
from tempfile import NamedTemporaryFile

from androguard.misc import AnalyzeAPK

from services.parsers import normalize_permissions


# Reduce verbose Androguard debug output.
logging.getLogger("androguard").setLevel(logging.WARNING)
logging.getLogger("androguard.core.analysis.analysis").setLevel(
    logging.WARNING
)


def parse_apk(raw: bytes) -> dict:
    """
    Extract the package name and declared permissions
    from an Android APK file.
    """

    if not raw:
        raise ValueError("The uploaded APK file is empty.")

    temp_path = None

    try:
        # Write the uploaded APK to a temporary file.
        with NamedTemporaryFile(
            suffix=".apk",
            delete=False
        ) as temp_file:
            temp_file.write(raw)
            temp_path = Path(temp_file.name)

        # Analyze the APK using Androguard.
        apk, _, _ = AnalyzeAPK(str(temp_path))

        package_name = apk.get_package()
        permissions = normalize_permissions(
            apk.get_permissions() or []
        )

        if not package_name:
            raise ValueError(
                "Could not identify the APK package name."
            )

        if not permissions:
            raise ValueError(
                "No declared permissions were found in this APK."
            )

        return {
            "app_name": package_name,
            "package_name": package_name,
            "purpose": "",
            "category": "general",
            "permissions": permissions,
        }

    except ValueError:
        raise

    except Exception as exc:
        logging.getLogger(__name__).exception(
            "APK analysis failed."
        )
        raise ValueError(
            "Unable to parse this APK. Ensure it is a valid Android APK."
        ) from exc

    finally:
        if temp_path is not None:
            try:
                temp_path.unlink(missing_ok=True)
            except OSError:
                logging.getLogger(__name__).warning(
                    "Could not remove temporary APK file: %s",
                    temp_path
                )
