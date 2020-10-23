select
	sy.system_name,
    sy.address,
    sy.port,
    sd.service_definition,
    sr.service_uri,
    sr.metadata
from arrowhead.service_registry as sr
JOIN arrowhead.system_ as sy
	ON sr.system_id = sy.id
JOIN arrowhead.service_definition as sd
	ON sr.service_id = sd.id;